import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn(async () => ({ status: "updated", postId: "9", count: 3 }));
let enabled = true;
vi.mock("server-only", () => ({}));
vi.mock("@/lib/webhooks/deps", () => ({ countDeps: () => ({}) }));
vi.mock("@/lib/webhooks/comment-count", () => ({ refreshCommentCount: (...a: unknown[]) => refresh(...(a as [])) }));
vi.mock("@/lib/circle/admin", () => ({ circleSyncEnabled: () => enabled }));

process.env.CIRCLE_WEBHOOK_SECRET = "circle-secret";
const { POST } = await import("./route");

const post = (body: unknown, headers: Record<string, string> = { "x-webhook-secret": "circle-secret" }, url = "http://localhost/api/webhooks/circle") =>
  POST(new Request(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) }));

beforeEach(() => {
  refresh.mockClear();
  enabled = true;
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("POST /api/webhooks/circle", () => {
  it("rejects a missing or wrong secret", async () => {
    expect((await post({ post_id: 9 }, {})).status).toBe(401);
    expect((await post({ post_id: 9 }, { "x-webhook-secret": "wrong" })).status).toBe(401);
    expect(refresh).not.toHaveBeenCalled();
  });
  it("refreshes the count for the event's post", async () => {
    const res = await post({ post: { id: 9 } });
    expect(await res.json()).toEqual({ ok: true, status: "updated", postId: "9", count: 3 });
    expect(refresh).toHaveBeenCalledWith({ postId: "9", commentId: null }, {});
  });
  it("accepts the secret as a query value for senders without headers", async () => {
    expect((await post({ post_id: 9 }, {}, "http://localhost/api/webhooks/circle?secret=circle-secret")).status).toBe(200);
  });
  it("400s on a payload with no ids, and does nothing while sync is off", async () => {
    expect((await post({ hello: "world" })).status).toBe(400);
    enabled = false;
    expect(await (await post({ post_id: 9 })).json()).toEqual({ ok: true, status: "disabled" });
    expect(refresh).not.toHaveBeenCalled();
  });
});
