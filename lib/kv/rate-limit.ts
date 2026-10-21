import "server-only";
import { kv, kvConfigured } from "./client";

/**
 * Fixed-window counter: true while `key` has been hit at most `limit` times in the current window. Without KV it
 * allows everything, like the locks; the form's honeypot and timing check still apply.
 */
export async function withinLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  if (!kvConfigured()) return true;
  try {
    const count = Number(await kv(["INCR", key]));
    if (count === 1) await kv(["EXPIRE", key, windowSeconds]);
    return count <= limit;
  } catch (err) {
    console.warn(JSON.stringify({ event: "rate_limit_skipped", key, error: String(err) }));
    return true;
  }
}
