import "server-only";

// Upstash Redis over its REST API (Vercel's KV integration sets these two variables). Without them every KV feature
// degrades to a no-op with a warning: fine locally, never in production.
const url = process.env.KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN;

export function kvConfigured(): boolean {
  return !!url && !!token;
}

export async function kv(args: Array<string | number>): Promise<unknown> {
  const res = await fetch(url!, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`KV ${args[0]} failed: ${res.status}`);
  return ((await res.json()) as { result: unknown }).result;
}
