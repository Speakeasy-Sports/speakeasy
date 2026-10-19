import "server-only";
import { kv, kvConfigured } from "./client";

// Admin API call counts per UTC day and route label, for the weekly summary (AGENTS.md section 14).
const KEEP_DAYS = 60;
const key = (day: string) => `circle-api:${day}`;

export const utcDay = (d: Date) => d.toISOString().slice(0, 10);

/** Fire and forget: counting must never fail or slow an API call. */
export function countCircleCall(route: string): void {
  if (!kvConfigured()) return;
  const k = key(utcDay(new Date()));
  void kv(["HINCRBY", k, route, 1])
    .then(() => kv(["EXPIRE", k, KEEP_DAYS * 86400]))
    .catch(() => {});
}

/** Totals for the 7 UTC days ending yesterday. */
export async function weeklyCircleUsage(today: Date): Promise<{ from: string; to: string; total: number; byRoute: Record<string, number> }> {
  const days = Array.from({ length: 7 }, (_, i) => utcDay(new Date(today.getTime() - (7 - i) * 86400_000)));
  const byRoute: Record<string, number> = {};
  if (kvConfigured()) {
    for (const day of days) {
      const flat = ((await kv(["HGETALL", key(day)])) as string[] | null) ?? [];
      for (let i = 0; i + 1 < flat.length; i += 2) byRoute[flat[i]!] = (byRoute[flat[i]!] ?? 0) + Number(flat[i + 1]);
    }
  }
  return { from: days[0]!, to: days[6]!, total: Object.values(byRoute).reduce((a, b) => a + b, 0), byRoute };
}
