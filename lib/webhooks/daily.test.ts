import { describe, expect, it, vi } from "vitest";
import { runDaily, type DailyDeps } from "./daily";

function deps(over: Partial<DailyDeps> = {}) {
  return {
    circleEnabled: true,
    candidates: vi.fn(async () => ({ retry: ["a1", "a2"], counts: ["9", null, "10"] })),
    finalize: vi.fn(async (id: string) => (id === "a2" ? Promise.reject(new Error("x")) : { statusFlipped: false, circle: "created" as const })),
    refreshCount: vi.fn(async (postId: string) => ({ status: "updated" as const, postId, count: 1 })),
    weeklyUsage: vi.fn(async () => ({ from: "2026-10-12", to: "2026-10-18", total: 40, byRoute: { "webhooks/sanity": 40 } })),
    log: vi.fn(),
    ...over,
  } satisfies DailyDeps;
}

describe("runDaily", () => {
  it("retries posts, refreshes counts, and keeps going past a failure", async () => {
    const d = deps();
    const s = await runDaily(new Date("2026-10-20T09:17:00Z"), d); // a Tuesday
    expect(d.candidates).toHaveBeenCalledWith("2026-10-17T09:17:00.000Z", "2026-10-13T09:17:00.000Z");
    expect(s.retried).toEqual({ created: 1, error: 1 });
    expect(s.counts).toEqual({ updated: 2 });
    expect(d.weeklyUsage).not.toHaveBeenCalled();
  });
  it("logs weekly Admin API usage on Mondays, even with sync off", async () => {
    const d = deps({ circleEnabled: false });
    const s = await runDaily(new Date("2026-10-19T09:17:00Z"), d);
    expect(d.candidates).not.toHaveBeenCalled();
    expect(s.usage).toMatchObject({ total: 40 });
    expect(d.log).toHaveBeenCalledWith("circle_admin_api_weekly", expect.objectContaining({ total: 40 }));
  });
});
