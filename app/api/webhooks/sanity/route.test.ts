import { beforeEach, describe, expect, it, vi } from "vitest";
import { encodeSignatureHeader, SIGNATURE_HEADER_NAME } from "@sanity/webhook";

const revalidateTag = vi.fn();
const afterTasks: Array<() => unknown> = [];
const finalize = vi.fn(async () => ({ statusFlipped: true, circle: "skipped" }));
const notifyReview = vi.fn(async () => {});

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidateTag: (...a: unknown[]) => revalidateTag(...a) }));
vi.mock("next/server", () => ({ after: (fn: () => unknown) => afterTasks.push(fn) }));
vi.mock("@/lib/webhooks/finalize-article", () => ({ finalizePublishedArticle: (...a: unknown[]) => finalize(...(a as [])) }));
vi.mock("@/lib/webhooks/deps", () => ({ finalizeDeps: () => ({}) }));
vi.mock("@/lib/webhooks/notify-review", () => ({ notifyReview: (...a: unknown[]) => notifyReview(...(a as [])) }));

const SECRET = "test-secret-123456";
process.env.SANITY_WEBHOOK_SECRET = SECRET;
const { POST } = await import("./route");

async function signed(body: unknown, secret = SECRET) {
  const text = JSON.stringify(body);
  return new Request("http://localhost/api/webhooks/sanity", {
    method: "POST",
    headers: { "content-type": "application/json", [SIGNATURE_HEADER_NAME]: await encodeSignatureHeader(text, Date.now(), secret) },
    body: text,
  });
}

beforeEach(() => {
  revalidateTag.mockClear();
  finalize.mockClear();
  notifyReview.mockClear();
  afterTasks.length = 0;
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("POST /api/webhooks/sanity", () => {
  it("rejects unsigned and wrongly signed requests without side effects", async () => {
    const unsigned = await POST(new Request("http://localhost/x", { method: "POST", body: "{}" }));
    expect(unsigned.status).toBe(401);
    const wrong = await POST(await signed({ _id: "a1", _type: "article" }, "other-secret-99999"));
    expect(wrong.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(afterTasks).toHaveLength(0);
  });

  it("rejects a signed body it does not understand", async () => {
    expect((await POST(await signed({ hello: 1 }))).status).toBe(400);
  });

  it("revalidates immediately and finalizes the article after the response", async () => {
    const res = await POST(await signed({ _id: "a1", _type: "article", operation: "update", slug: "story", status: "scheduled", textChanged: true }));
    expect(res.status).toBe(200);
    expect(revalidateTag.mock.calls).toEqual([
      ["article-slug:story", { expire: 0 }],
      ["articles", { expire: 0 }],
      ["home", { expire: 0 }],
    ]);
    expect(finalize).not.toHaveBeenCalled();
    await Promise.all(afterTasks.map((t) => t()));
    expect(finalize).toHaveBeenCalledWith("a1", { textChanged: true }, {});
  });

  it("does not finalize a deleted article", async () => {
    await POST(await signed({ _id: "a1", _type: "article", operation: "delete", slug: "story" }));
    expect(revalidateTag).toHaveBeenCalled();
    expect(afterTasks).toHaveLength(0);
  });

  it("emails on a draft moving into review, and nothing else for drafts", async () => {
    const res = await POST(await signed({ _id: "drafts.a1", _type: "article", operation: "update", status: "review", previousStatus: "draft" }));
    expect(await res.json()).toEqual({ ok: true, review: true });
    expect(revalidateTag).not.toHaveBeenCalled();
    await Promise.all(afterTasks.map((t) => t()));
    expect(notifyReview).toHaveBeenCalledWith("drafts.a1");

    afterTasks.length = 0;
    await POST(await signed({ _id: "drafts.a1", _type: "article", operation: "update", status: "review", previousStatus: "review" }));
    expect(afterTasks).toHaveLength(0);
  });
});
