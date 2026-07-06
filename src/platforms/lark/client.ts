/**
 * Lark CLI client wrapper.
 *
 * `lark-cli` (the Go binary at https://github.com/larksuite/cli) is a
 * first-class dependency of this module: it owns auth, OAuth refresh,
 * per-app scopes, and per-service call marshalling. We do NOT reimplement
 * HTTP / docx blocks / rate limiting — we just spawn the binary and parse
 * its JSON output.
 *
 * Why a process instead of importing a Node SDK? Two reasons:
 *   1. The official `oapi-sdk-nodejs` tracks a different (often older)
 *      OpenAPI snapshot than the platforms we need to call, and pinning
 *      per-endpoint request shapes by hand is exactly what the CLI
 *      shortcuts already do for us.
 *   2. The CLI handles `tenant_access_token` / user-token refresh +
 *      scope reporting transparently. We just need to know whether
 *      `lark-cli auth status` succeeded before kicking off a sync.
 *
 * The caller (LarkSyncer) supplies a `larkCliPath` for tests; default is
 * whatever `lark-cli` resolves to in $PATH.
 */
import { execFile } from "child_process";

/** A wiki node as returned by `wiki +node-list` / `wiki +node-get`. */
export interface WikiNode {
  space_id?: string;
  node_token: string;
  obj_token?: string;
  obj_type?: string;
  parent_node_token?: string;
  node_type?: string;
  title?: string;
  has_child?: boolean;
  /** Unix-seconds (string form); only present in +node-get responses. */
  obj_edit_time?: string;
  obj_create_time?: string;
  node_create_time?: string;
  updated_at?: string;
}

/** A wiki space as returned by `wiki +space-list`. */
export interface WikiSpace {
  space_id: string;
  name?: string;
  description?: string;
  space_type?: string;
  visibility?: string;
}

/** A minute hit as returned by `minutes +search`. */
export interface MinuteItem {
  /** Lark minute token; equals the last path segment of `meta_data.app_link`. */
  token: string;
  /** First line of `display_info` (the human title). */
  title: string;
  /** Full pretty description (e.g. "所有者: X 开始时间: ... 时长: ..."). */
  display_info: string;
  meta_data?: { app_link?: string; description?: string };
}

/** A minute's full metadata + AI artifacts (summary, transcript, chapters). */
export interface MinuteDetail {
  token: string;
  title: string;
  url: string;
  /** Milliseconds, as a string. */
  duration?: string;
  create_time?: string;
  note_id?: string;
  owner_id?: string;
  /** AI summary. */
  summary?: string;
  /** Full transcript in the lark format `speaker HH:MM:SS.mmm\ntext`. */
  transcript?: string;
  /** Section-by-section breakdown. */
  chapters?: Array<{
    title: string;
    summary_content: string;
    start_ms?: string;
    stop_ms?: string;
  }>;
  /** Plain-text todo lines extracted from the meeting. */
  todos?: Array<{ content?: string; assignee?: string }>;
  /** Keyword list (Chinese text). */
  keywords?: string[];
}

/** Caller-supplied options. */
export interface LarkClientOptions {
  /** Override the binary path (default: "lark-cli"). */
  larkCliPath?: string;
  /** Identity to pass as `--as`. Default "user". */
  as?: "user" | "bot";
  /** Max stdout buffer; docx fetches can be a few MB. Default 64MB. */
  maxBuffer?: number;
}

interface LarkCliEnvelope<T> {
  ok: boolean;
  identity?: string;
  data?: T;
  error?: { type: string; message: string };
  _notice?: unknown;
}

export class LarkClient {
  private readonly bin: string;
  private readonly as: string;
  private readonly maxBuffer: number;

  constructor(opts: LarkClientOptions = {}) {
    this.bin = opts.larkCliPath ?? "lark-cli";
    this.as = opts.as ?? "user";
    this.maxBuffer = opts.maxBuffer ?? 64 * 1024 * 1024;
  }

  /**
   * Run `lark-cli <args...>` and parse the JSON envelope.
   *
   * Throws on:
   *   - non-zero exit (process spawn failure)
   *   - non-JSON stdout
   *   - envelope `ok: false`
   *
   * Some `lark-cli api` shortcuts emit raw API envelopes (`{code, data, msg}`)
   * without the outer `{ok, data, error}` wrapper. Those responses are
   * recognized by a top-level `code` field and remapped automatically.
   */
  async run<T>(args: string[]): Promise<T> {
    const stdout = await this.exec(args);
    let parsed: LarkCliEnvelope<T> | (T & { code?: number; msg?: string });
    try {
      parsed = JSON.parse(stdout);
    } catch (e) {
      throw new Error(
        `lark-cli ${args[0]} ${args[1] ?? ""} returned non-JSON output: ${stdout.slice(0, 200)}`,
      );
    }
    // Outer envelope (most shortcuts).
    if (parsed && typeof parsed === "object" && "ok" in (parsed as object)) {
      const env = parsed as LarkCliEnvelope<T>;
      if (!env.ok) {
        const msg = env.error?.message ?? `lark-cli ${args.join(" ")} failed`;
        throw new Error(msg);
      }
      return (env.data ?? ({} as T)) as T;
    }
    // Inner raw API envelope (`lark-cli api ...` outputs `{code, data, msg}`).
    if (
      parsed &&
      typeof parsed === "object" &&
      "code" in (parsed as object) &&
      typeof (parsed as { code: unknown }).code === "number"
    ) {
      const inner = parsed as { code: number; data?: T; msg?: string };
      if (inner.code !== 0) {
        throw new Error(`lark-cli api error ${inner.code}: ${inner.msg ?? "unknown"}`);
      }
      return (inner.data ?? ({} as T)) as T;
    }
    // Last resort: assume the parsed object IS the data.
    return parsed as T;
  }

  private exec(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      execFile(
        this.bin,
        args,
        { maxBuffer: this.maxBuffer, encoding: "utf8" },
        (err, stdout, stderr) => {
          if (err) {
            const e = err as Error & { code?: string; stderr?: string };
            reject(
              new Error(
                `lark-cli ${args[0]} ${args[1] ?? ""} failed (${e.code ?? "error"}): ${
                  e.stderr || err.message
                }`,
              ),
            );
            return;
          }
          resolve(stdout);
        },
      );
    });
  }

  /**
   * Walk a wiki subtree, returning every leaf + intermediate node.
   *
   * `+node-list` is page-by-page; we paginate ourselves so the caller
   * can keep one in-memory list (caller controls `--page-limit`).
   */
  async listWikiNodes(spaceId: string, opts?: { parentNodeToken?: string }): Promise<WikiNode[]> {
    const args = [
      "wiki",
      "+node-list",
      "--space-id",
      spaceId,
      "--as",
      this.as,
      "--format",
      "json",
    ];
    if (opts?.parentNodeToken) {
      args.push("--parent-node-token", opts.parentNodeToken);
    }
    args.push("--page-all", "--page-limit", "100");
    const out = await this.run<{ nodes: WikiNode[]; has_more: boolean; page_token: string }>(args);
    return out.nodes ?? [];
  }

  /** Fetch the list of wiki spaces the current user can access. */
  async listWikiSpaces(): Promise<WikiSpace[]> {
    const out = await this.run<{ spaces: WikiSpace[] }>([
      "wiki",
      "+space-list",
      "--as",
      this.as,
      "--format",
      "json",
    ]);
    return out.spaces ?? [];
  }

  /**
   * Resolve a single node by obj_token (and obj_type) to its full
   * metadata, including unix-seconds edit / create timestamps.
   */
  async getWikiNode(objToken: string, objType: string): Promise<WikiNode> {
    const args = [
      "wiki",
      "+node-get",
      "--node-token",
      objToken,
      "--obj-type",
      objType,
      "--as",
      this.as,
      "--format",
      "json",
    ];
    return this.run<WikiNode>(args);
  }

  /**
   * Fetch a docx as plain markdown. Returns the markdown body.
   *
   * Note: Lark returns the doc under `data.document.content`; some
   * empty / locked docs return empty string rather than throwing.
   */
  async fetchDocMarkdown(objToken: string): Promise<string> {
    const out = await this.run<{ document: { content: string } }>([
      "docs",
      "+fetch",
      "--doc",
      objToken,
      "--doc-format",
      "markdown",
      "--scope",
      "full",
      "--as",
      this.as,
      "--format",
      "json",
    ]);
    return out.document?.content ?? "";
  }

  /**
   * Fetch full minute detail (metadata + summary + transcript +
   * chapters + keywords + todos).
   *
   * Calls two endpoints:
   *   - GET /open-apis/minutes/v1/minutes/{token}        → metadata
   *   - GET /open-apis/minutes/v1/minutes/{token}/artifacts → AI bits
   *
   * Throws if the user lacks `minutes:minutes.basic:read` /
   * `minutes:minutes.artifacts:read` scopes; the caller should have
   * run `lark-cli auth login` to grant them.
   */
  async getMinuteDetail(token: string): Promise<MinuteDetail> {
    const meta = await this.run<{
      minute: {
        token: string;
        title: string;
        url?: string;
        duration?: string;
        create_time?: string;
        note_id?: string;
        owner_id?: string;
      };
    }>(["api", "GET", `/open-apis/minutes/v1/minutes/${token}`, "--as", this.as]);

    const arts = await this.run<{
      summary?: string;
      transcript?: string;
      minute_chapters?: MinuteDetail["chapters"];
      minute_todos?: MinuteDetail["todos"];
      keywords?: string[];
    }>(["api", "GET", `/open-apis/minutes/v1/minutes/${token}/artifacts`, "--as", this.as]);

    const m = meta.minute ?? ({} as MinuteDetail);
    return {
      token: m.token ?? token,
      title: m.title ?? "untitled",
      url: m.url ?? `https://feishu.cn/minutes/${token}`,
      duration: m.duration,
      create_time: m.create_time,
      note_id: m.note_id,
      owner_id: m.owner_id,
      summary: arts.summary,
      transcript: arts.transcript,
      chapters: arts.minute_chapters,
      todos: arts.minute_todos,
      keywords: arts.keywords,
    };
  }

  /**
   * Search minutes by date range. Returns raw `display_info` lines;
   * the caller splits the title out of the first line.
   *
   * `start` / `end` accept `YYYY-MM-DD` (the CLI parses both this and
   * ISO-8601). Pages internally; the per-page cap on `+search` is 30.
   */
  async searchMinutes(opts: { start: string; end: string }): Promise<MinuteItem[]> {
    const all: MinuteItem[] = [];
    let pageToken: string | undefined;
    // Per-CLI hard cap is 30; we walk all pages ourselves.
    const pageSize = 30;
    for (let round = 0; round < 100; round++) {
      const args = [
        "minutes",
        "+search",
        "--start",
        opts.start,
        "--end",
        opts.end,
        "--as",
        this.as,
        "--page-size",
        String(pageSize),
        "--format",
        "json",
      ];
      if (pageToken) args.push("--page-token", pageToken);
      const out = await this.run<{
        items: MinuteItem[];
        has_more: boolean;
        page_token: string;
      }>(args);
      for (const item of out.items ?? []) all.push(item);
      if (!out.has_more || !out.page_token) break;
      pageToken = out.page_token;
    }
    return all;
  }

  /**
   * Optional pre-flight: confirm `lark-cli` is on $PATH and authenticated.
   * Cheap (one binary invocation); useful at the top of `okfa sync lark`
   * to give a fast, actionable error instead of a late stderr flood.
   *
   * `auth status` ignores `--format` on current lark-cli versions and
   * emits JSON when stdout is a tty-detached pipe — so we just parse
   * whatever it returns.
   */
  async ping(): Promise<{ ok: boolean; identity?: string; message?: string }> {
    return new Promise((resolve) => {
      execFile(
        this.bin,
        ["auth", "status", "--json"],
        { encoding: "utf8", timeout: 10_000 },
        (err, stdout) => {
          if (err) {
            resolve({ ok: false, message: `lark-cli auth status failed: ${err.message}` });
            return;
          }
          try {
            const parsed = JSON.parse(stdout);
            resolve({ ok: !!parsed.identity, identity: parsed.identity });
          } catch {
            resolve({ ok: false, message: "lark-cli auth status returned non-JSON" });
          }
        },
      );
    });
  }
}