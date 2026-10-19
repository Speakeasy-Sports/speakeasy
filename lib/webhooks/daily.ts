// The daily Circle job (AGENTS.md 7.2 step 4 and 7.3): retry failed or missing posts, refresh recent comment counts,
// and on Mondays log the week's Admin API usage. Dependencies are passed in so this is unit tested.
import type { CountResult } from "./comment-count";
import type { FinalizeResult } from "./finalize-article";

export type DailyDeps = {
  circleEnabled: boolean;
  candidates(postSince: string, countSince: string): Promise<{ retry: string[]; counts: Array<string | null> }>;
  finalize(id: string): Promise<FinalizeResult>;
  refreshCount(postId: string): Promise<CountResult>;
  weeklyUsage(): Promise<{ from: string; to: string; total: number; byRoute: Record<string, number> }>;
  log(event: string, data: Record<string, unknown>): void;
};

const DAY = 86400_000;
/** Articles published in the last 3 days with no post get one; older ones are left alone so turning sync on never floods a space. */
const POST_WINDOW_DAYS = 3;
const COUNT_WINDOW_DAYS = 7;

export async function runDaily(now: Date, deps: DailyDeps) {
  const summary = { retried: {} as Record<string, number>, counts: {} as Record<string, number>, usage: null as unknown };
  if (deps.circleEnabled) {
    const since = (days: number) => new Date(now.getTime() - days * DAY).toISOString();
    const { retry, counts } = await deps.candidates(since(POST_WINDOW_DAYS), since(COUNT_WINDOW_DAYS));
    // One at a time: a dozen calls a day does not need concurrency, and serial calls stay far from the rate limit.
    for (const id of retry) {
      const r = await deps.finalize(id).catch(() => ({ circle: "error" as const, statusFlipped: false }));
      summary.retried[r.circle] = (summary.retried[r.circle] ?? 0) + 1;
    }
    for (const postId of counts) {
      if (!postId) continue;
      const r = await deps.refreshCount(postId).catch(() => ({ status: "error" as const }));
      summary.counts[r.status] = (summary.counts[r.status] ?? 0) + 1;
    }
  }
  if (now.getUTCDay() === 1) {
    summary.usage = await deps.weeklyUsage();
    deps.log("circle_admin_api_weekly", summary.usage as Record<string, unknown>);
  }
  deps.log("circle_daily", summary);
  return summary;
}
