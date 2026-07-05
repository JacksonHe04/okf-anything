/**
 * Minimal Lark token / API client.
 *
 * Note: this is a stub for v1. The full set of pull helpers (similar to
 * Notion's page/database/search/blocks) is left for follow-up. The
 * scaffolding here is enough to compile, register a syncer, and respond
 * to `--help`.
 */
import * as http from "http";
import * as https from "https";
import { URL } from "url";
import type { LarkContext, LarkDoc } from "./client.js";

export type { LarkContext, LarkDoc };

interface TokenResponse {
  tenant_access_token: string;
  expire: number;
}

export class LarkClient {
  private token?: { value: string; expiresAt: number };

  constructor(private readonly ctx: LarkContext) {}

  private async getTenantAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.token && this.token.expiresAt > now + 60_000) return this.token.value;

    const body = JSON.stringify({
      app_id: this.ctx.appId,
      app_secret: this.ctx.appSecret,
    });
    const url = new URL("/open-apis/auth/v3/tenant_access_token/internal", this.ctx.baseUrl);
    const data = await postJson(url, body);
    const parsed = JSON.parse(data) as TokenResponse;
    this.token = { value: parsed.tenant_access_token, expiresAt: now + parsed.expire * 1000 };
    return this.token.value;
  }

  /**
   * Best-effort fetch of a doc meta. Lark's API is split across wiki / docx
   * surfaces; this returns an empty stub when the call is not wired up yet.
   */
  async fetchDoc(token: string): Promise<LarkDoc | null> {
    const accessToken = await this.getTenantAccessToken().catch(() => null);
    if (!accessToken) return null;
    // Wire-up of `/open-apis/docx/v1/documents/{token}` is intentionally
    // left as a TODO follow-up; return null until shipped.
    void token;
    void accessToken;
    return null;
  }
}

function postJson(url: URL, body: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(
      {
        method: "POST",
        hostname: url.hostname,
        port: url.port || url.protocol === "https:" ? 443 : 80,
        path: url.pathname,
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
      },
      (res) => {
        let buf = "";
        res.on("data", (d) => (buf += d));
        res.on("end", () => resolve(buf));
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}
