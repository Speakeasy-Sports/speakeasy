import "server-only";
import { kv, kvConfigured } from "./client";

// Short-lived locks so a double delivery does not do the same work twice (AGENTS.md 7.2).
export type Lock = { acquired: boolean; release: () => Promise<void> };

export async function acquireLock(key: string, ttlSeconds: number): Promise<Lock> {
  if (!kvConfigured()) {
    console.warn(JSON.stringify({ event: "kv_lock_skipped", key, reason: "KV_REST_API_URL or KV_REST_API_TOKEN not set" }));
    return { acquired: true, release: async () => {} };
  }
  const value = crypto.randomUUID();
  const ok = (await kv(["SET", key, value, "NX", "EX", ttlSeconds])) === "OK";
  return {
    acquired: ok,
    // Delete only if we still hold it, so a lock that expired and was taken by another run is left alone.
    release: async () => {
      if (!ok) return;
      await kv(["EVAL", 'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end', 1, key, value]).catch(
        () => {},
      );
    },
  };
}
