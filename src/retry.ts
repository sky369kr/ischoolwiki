// One slow retry after the SDK's own quick retries have given up. A brief API outage (an overloaded
// or 5xx response) otherwise holds an article whose content was fine, as on 2026-11-13.

export function isTransient(err: unknown): boolean {
  const status = (err as { status?: number } | null)?.status;
  if (typeof status === "number") return status === 408 || status === 409 || status === 429 || status >= 500;
  const msg = err instanceof Error ? err.message : String(err);
  return /\b(429|5\d\d)\b|overloaded|timeout|timed out|ECONNRESET|network/i.test(msg);
}

export async function retryOnce<T>(fn: () => Promise<T>, waitMs: number, sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (!isTransient(err)) throw err;
    await sleep(waitMs);
    return fn();
  }
}
