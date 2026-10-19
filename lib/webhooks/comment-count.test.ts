import { describe, expect, it, vi } from "vitest";
import { refreshCommentCount, type CountDeps } from "./comment-count";

function deps(over: Partial<CountDeps> = {}) {
  return {
    findArticle: vi.fn(async () => ({ _id: "a1", slug: "story", circleCommentCount: 2 as number | null, versions: ["drafts.a1"] })),
    writeCount: vi.fn(async () => {}),
    commentCount: vi.fn(async () => 5),
    postIdForComment: vi.fn(async () => "9"),
    lock: vi.fn(async () => ({ acquired: true, release: vi.fn(async () => {}) })),
    revalidate: vi.fn(),
    log: () => {},
    ...over,
  } satisfies CountDeps;
}

describe("refreshCommentCount", () => {
  it("writes the new count to the article and its draft, then revalidates the article", async () => {
    const d = deps();
    expect(await refreshCommentCount({ postId: "9", commentId: null }, d)).toEqual({ status: "updated", postId: "9", count: 5 });
    expect(d.writeCount).toHaveBeenCalledWith(["a1", "drafts.a1"], 5);
    expect(d.revalidate).toHaveBeenCalledWith("article-slug:story");
    expect(d.postIdForComment).not.toHaveBeenCalled();
  });
  it("resolves the post from a comment id", async () => {
    const d = deps();
    await refreshCommentCount({ postId: null, commentId: "77" }, d);
    expect(d.postIdForComment).toHaveBeenCalledWith("77");
    expect(d.findArticle).toHaveBeenCalledWith("9");
  });
  it("skips writes when the count is unchanged", async () => {
    const d = deps({ commentCount: vi.fn(async () => 2) });
    expect((await refreshCommentCount({ postId: "9", commentId: null }, d)).status).toBe("unchanged");
    expect(d.writeCount).not.toHaveBeenCalled();
  });
  it("records a first count of zero", async () => {
    const d = deps({ findArticle: vi.fn(async () => ({ _id: "a1", slug: "story", circleCommentCount: null, versions: [] })), commentCount: vi.fn(async () => 0) });
    expect((await refreshCommentCount({ postId: "9", commentId: null }, d)).status).toBe("updated");
  });
  it("ignores posts the site did not create, and bursts inside the window", async () => {
    const none = deps({ findArticle: vi.fn(async () => null) });
    expect((await refreshCommentCount({ postId: "9", commentId: null }, none)).status).toBe("no_article");
    expect(none.commentCount).not.toHaveBeenCalled();
    const busy = deps({ lock: vi.fn(async () => ({ acquired: false, release: vi.fn(async () => {}) })) });
    expect((await refreshCommentCount({ postId: "9", commentId: null }, busy)).status).toBe("busy");
    expect(busy.commentCount).not.toHaveBeenCalled();
  });
  it("reports a comment whose post cannot be found", async () => {
    const d = deps({ postIdForComment: vi.fn(async () => null) });
    expect(await refreshCommentCount({ postId: null, commentId: "77" }, d)).toEqual({ status: "no_post", postId: null });
  });
});
