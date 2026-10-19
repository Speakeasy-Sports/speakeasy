import { describe, expect, it, vi } from "vitest";
import { finalizePublishedArticle, type FinalizeDeps, type SyncArticle } from "./finalize-article";

const NOW = "2026-10-19T15:00:00.000Z";

function article(over: Partial<SyncArticle> = {}): SyncArticle {
  return {
    _id: "a1",
    title: "Healthy line",
    dek: "The dek",
    slug: "healthy-line",
    status: "scheduled",
    publishedAt: null,
    circlePostId: null,
    circleSyncError: null,
    school: { slug: "georgia", circleSpaceId: "123" },
    heroImageUrl: null,
    ...over,
  };
}

function deps(a: SyncArticle | null, over: Partial<FinalizeDeps> = {}, circle: Partial<FinalizeDeps["circle"]> = {}) {
  const d = {
    fetchArticle: vi.fn(async () => ({ article: a, versions: ["drafts.a1"] })),
    commit: vi.fn(async () => {}),
    lock: vi.fn(async () => ({ acquired: true, release: vi.fn(async () => {}) })),
    circle: {
      enabled: true,
      create: vi.fn(async () => ({ id: "p9", url: "https://club.example/p9" })),
      update: vi.fn(async () => {}),
      ...circle,
    },
    now: () => NOW,
    log: () => {},
    ...over,
  };
  return d;
}

function firstCommit(d: FinalizeDeps): Parameters<FinalizeDeps["commit"]> {
  const call = vi.mocked(d.commit).mock.calls[0];
  if (!call) throw new Error("commit was not called");
  return call;
}

describe("finalizePublishedArticle", () => {
  it("flips status, sets publishedAt, creates the Circle post, and copies Circle fields to the draft", async () => {
    const d = deps(article());
    const r = await finalizePublishedArticle("a1", { textChanged: true }, d);
    expect(r).toEqual({ statusFlipped: true, circle: "created" });
    expect(d.circle.create).toHaveBeenCalledWith(
      expect.objectContaining({ spaceId: "123", title: "Healthy line", url: "https://speakeasysports.com/georgia/healthy-line" }),
    );
    const [id, published, versions] = firstCommit(d);
    expect(id).toBe("a1");
    expect(published.set).toEqual({ status: "published", circlePostId: "p9", circlePostUrl: "https://club.example/p9", circleSyncedAt: NOW });
    expect(published.setIfMissing).toEqual({ publishedAt: NOW });
    expect(versions.ids).toEqual(["drafts.a1"]);
    expect(versions.patch.set).not.toHaveProperty("status");
    expect(versions.patch.set).toHaveProperty("circlePostId", "p9");
    expect(versions.patch.setIfMissing).toEqual({ publishedAt: NOW });
  });

  it("changes nothing on the echo delivery after its own patch", async () => {
    const d = deps(article({ status: "published", publishedAt: NOW, circlePostId: "p9" }));
    const r = await finalizePublishedArticle("a1", { textChanged: false }, d);
    expect(r).toEqual({ statusFlipped: false, circle: "unchanged" });
    expect(d.commit).not.toHaveBeenCalled();
    expect(d.circle.create).not.toHaveBeenCalled();
  });

  it("updates the Circle post when the title or dek changed", async () => {
    const d = deps(article({ status: "published", publishedAt: NOW, circlePostId: "p9" }));
    const r = await finalizePublishedArticle("a1", { textChanged: true }, d);
    expect(r.circle).toBe("updated");
    expect(d.circle.update).toHaveBeenCalledWith("p9", expect.objectContaining({ title: "Healthy line" }));
  });

  it("keeps an existing publishedAt", async () => {
    const d = deps(article({ publishedAt: "2026-10-01T12:00:00Z", circlePostId: "p9" }));
    await finalizePublishedArticle("a1", { textChanged: false }, d);
    const published = firstCommit(d)[1];
    expect(published.setIfMissing).toEqual({});
    expect(published.set).toEqual({ status: "published" });
  });

  it("records a Circle failure once and does not retry it on the echo", async () => {
    const d = deps(article({ status: "published" }), {}, { create: vi.fn(async () => Promise.reject(new Error("Circle 500"))) });
    const r = await finalizePublishedArticle("a1", { textChanged: false }, d);
    expect(r.circle).toBe("error");
    expect(firstCommit(d)[1].set).toEqual({ circleSyncError: "Circle 500" });

    const echo = deps(article({ status: "published", circleSyncError: "Circle 500" }));
    expect((await finalizePublishedArticle("a1", { textChanged: false }, echo)).circle).toBe("skipped");
    expect(echo.circle.create).not.toHaveBeenCalled();
    expect(echo.commit).not.toHaveBeenCalled();
  });

  it("retries a recorded error when the retry job asks, and clears it on success", async () => {
    const d = deps(article({ status: "published", circleSyncError: "Circle 500" }));
    expect((await finalizePublishedArticle("a1", { textChanged: false, retry: true }, d)).circle).toBe("created");
    expect(firstCommit(d)[1].unset).toEqual(["circleSyncError"]);
  });

  it("writes a config error without calling Circle when the school has no space", async () => {
    const d = deps(article({ status: "published", school: { slug: "georgia", circleSpaceId: null } }));
    expect((await finalizePublishedArticle("a1", { textChanged: true }, d)).circle).toBe("error");
    expect(d.circle.create).not.toHaveBeenCalled();
  });

  it("still flips status but leaves Circle alone when another delivery holds the lock", async () => {
    const d = deps(article(), { lock: vi.fn(async () => ({ acquired: false, release: vi.fn(async () => {}) })) });
    const r = await finalizePublishedArticle("a1", { textChanged: true }, d);
    expect(r).toEqual({ statusFlipped: true, circle: "locked" });
    expect(d.circle.create).not.toHaveBeenCalled();
  });

  it("only flips status while Circle sync is off", async () => {
    const d = deps(article(), {}, { enabled: false });
    expect(await finalizePublishedArticle("a1", { textChanged: true }, d)).toEqual({ statusFlipped: true, circle: "skipped" });
    expect(d.circle.create).not.toHaveBeenCalled();
  });

  it("releases the lock even when the read fails", async () => {
    const release = vi.fn(async () => {});
    const d = deps(article(), { fetchArticle: vi.fn(async () => Promise.reject(new Error("down"))), lock: vi.fn(async () => ({ acquired: true, release })) });
    await expect(finalizePublishedArticle("a1", { textChanged: true }, d)).rejects.toThrow("down");
    expect(release).toHaveBeenCalled();
  });
});
