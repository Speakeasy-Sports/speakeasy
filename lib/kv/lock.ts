import "server-only";

// Short-lived locks over the Upstash Redis REST API (Vercel's KV integration sets these two variables).
// Without them, locking is skipped with a warning: fine locally, never in production.
const url = process.env.KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN;

async function command(args: Array<string | number>): Promise<unknown> {
  const res = await fetch(url!, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`KV ${args[0]} failed: ${res.status}`);
  return ((await res.json()) as { result: unknown }).result;
}

export type Lock = { acquired: boolean; release: () => Promise<void> };

export async function acquireLock(key: string, ttlSeconds: number): Promise<Lock> {
  if (!url || !token) {
    console.warn(JSON.stringify({ event: "kv_lock_skipped", key, reason: "KV_REST_API_URL or KV_REST_API_TOKEN not set" }));
    return { acquired: true, release: async () => {} };
  }
  const value = crypto.randomUUID();
  const ok = (await command(["SET", key, value, "NX", "EX", ttlSeconds])) === "OK";
  return {
    acquired: ok,
    // Delete only if we still hold it, so a lock that expired and was taken by another run is left alone.
    release: async () => {
      if (!ok) return;
      await command(["EVAL", 'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end', 1, key, value]).catch(
        () => {},
      );
    },
  };
}
