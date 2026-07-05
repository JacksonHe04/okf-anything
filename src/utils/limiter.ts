/**
 * 限流 + 429 重试封装
 *
 * Notion 官方限制: 3 req/s 平均,允许一定突发。
 * - intervalCap/interval = 平均 3 req/s
 * - 429 时读 Retry-After header, sleep 后重试
 * - 其他错误做指数退避 + jitter
 */
import PQueue from "p-queue";

const DEFAULT_INTERVAL_MS = 1000;
const DEFAULT_INTERVAL_CAP = 3;
const DEFAULT_RETRY = 3;

export interface LimiterOptions {
  intervalCap?: number;
  intervalMs?: number;
  maxRetries?: number;
}

export class NotionLimiter {
  private queue: PQueue;
  private readonly maxRetries: number;

  constructor(opts: LimiterOptions = {}) {
    const intervalCap = opts.intervalCap ?? DEFAULT_INTERVAL_CAP;
    const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
    this.maxRetries = opts.maxRetries ?? DEFAULT_RETRY;
    this.queue = new PQueue({
      concurrency: 1,
      intervalCap,
      interval: intervalMs,
    });
  }

  /**
   * 把任意异步函数送入限流队列,自动处理 429 + 指数退避
   */
  async run<T>(fn: () => Promise<T>, label?: string): Promise<T> {
    return this.queue.add(async () => {
      let lastErr: unknown;
      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        try {
          return await fn();
        } catch (err: unknown) {
          lastErr = err;
          const info = parseError(err);
          if (info.retryAfterMs != null) {
            if (attempt >= this.maxRetries) {
              throw err;
            }
            const wait = info.retryAfterMs + jitter(250);
            logRetry(label, attempt + 1, "Retry-After", wait);
            await sleep(wait);
            continue;
          }
          if (info.transient) {
            if (attempt >= this.maxRetries) {
              throw err;
            }
            const wait = backoff(attempt) + jitter(500);
            logRetry(label, attempt + 1, "transient", wait);
            await sleep(wait);
            continue;
          }
          throw err;
        }
      }
      throw lastErr;
    }) as Promise<T>;
  }

  get pending(): number {
    return this.queue.size + this.queue.pending;
  }

  async onIdle(): Promise<void> {
    await this.queue.onIdle();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function backoff(attempt: number): number {
  return Math.min(30_000, 500 * 2 ** attempt);
}

function jitter(maxMs: number): number {
  return Math.floor(Math.random() * maxMs);
}

function parseError(err: unknown): {
  retryAfterMs: number | null;
  transient: boolean;
  code?: string;
} {
  // Notion SDK error shape: APIResponseError has `.code`, `.status`, `.headers`
  const anyErr = err as {
    code?: string;
    status?: number;
    headers?: Record<string, string | string[] | undefined>;
  };
  const code = anyErr?.code;
  const status = anyErr?.status;
  const retryAfterHeader = anyErr?.headers?.["retry-after"];
  if (retryAfterHeader != null) {
    const seconds = Number(retryAfterHeader);
    if (!Number.isNaN(seconds)) {
      return { retryAfterMs: seconds * 1000, transient: false, code };
    }
  }
  if (code === "rate_limited" || status === 429) {
    return { retryAfterMs: 1000, transient: false, code };
  }
  if (
    code === "service_unavailable" ||
    status === 502 ||
    status === 503 ||
    status === 504
  ) {
    return { retryAfterMs: null, transient: true, code };
  }
  return { retryAfterMs: null, transient: false, code };
}

function logRetry(label: string | undefined, attempt: number, reason: string, waitMs: number) {
  const tag = label ? `[${label}]` : "";
  console.warn(
    `  ${tag} retry ${attempt} (${reason}), waiting ${Math.round(waitMs)}ms`,
  );
}