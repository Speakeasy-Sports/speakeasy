// Keeps circleCommentCount in step with the Circle post (AGENTS.md 7.3). Dependencies are passed in so this is unit
// tested without Sanity, Circle, or KV.
import { tags } from "@/lib/sanity/tags";
import type { CircleEventIds } from "./circle-payload";

export type CountDeps = {
  findArticle(postId: string): Promise<{ _id: string; slug: string | null; circleCommentCount: number | null; versions: string[] } | null>;
  /** Sets circleCommentCount on the published document and its drafts and versions, atomically. */
  writeCount(ids: string[], count: number): Promise<void>;
  commentCount(postId: string): Promise<number>;
  postIdForComment(commentId: string): Promise<string | null>;
  lock(key: string, ttlSeconds: number): Promise<{ acquired: boolean; release(): Promise<void> }>;
  revalidate(tag: string): void;
  log(event: string, data: Record<string, unknown>): void;
};

export type CountResult =
  | { status: "updated"; postId: string; count: number }
  | { status: "unchanged" | "busy"; postId: string }
  | { status: "no_post" | "no_article"; postId: string | null };

// A burst of comments arrives as a burst of events. One count read per post per window is enough; the daily job
// catches the last comment of a burst if it landed inside the window.
const WINDOW = 30;

export async function refreshCommentCount(ids: CircleEventIds, deps: CountDeps): Promise<CountResult> {
  const postId = ids.postId ?? (ids.commentId ? await deps.postIdForComment(ids.commentId) : null);
  if (!postId) return { status: "no_post", postId: null };

  const article = await deps.findArticle(postId);
  // A post the site did not create (a member's own post in the space). Not ours to count.
  if (!article) return { status: "no_article", postId };

  const lock = await deps.lock(`circle-count:${postId}`, WINDOW);
  if (!lock.acquired) return { status: "busy", postId };
  // Not released early: holding it for the window is what collapses the burst.
  const count = await deps.commentCount(postId);
  if (count === (article.circleCommentCount ?? 0) && article.circleCommentCount !== null) return { status: "unchanged", postId };

  await deps.writeCount([article._id, ...article.versions], count);
  if (article.slug) deps.revalidate(tags.articleSlug(article.slug));
  deps.log("circle_comment_count", { postId, article: article._id, count });
  return { status: "updated", postId, count };
}
