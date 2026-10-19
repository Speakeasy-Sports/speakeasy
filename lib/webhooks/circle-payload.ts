// Parsing and auth for /api/webhooks/circle (AGENTS.md 7.3). Pure, unit tested.
import { timingSafeEqual } from "node:crypto";

export type CircleEventIds = { postId: string | null; commentId: string | null };

const id = (v: unknown): string | null => (typeof v === "number" || (typeof v === "string" && /^\d+$/.test(v)) ? String(v) : null);
const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

/**
 * The Workflow webhook body is configured in Circle, so accept the shapes it is likely to take: a post or comment id
 * at the top level, or nested under post, comment, data, or resource. A comment event without a post id costs one
 * extra Admin API call to look the post up.
 */
export function extractIds(body: unknown, query: URLSearchParams): CircleEventIds {
  const roots = [obj(body)].filter((r): r is Record<string, unknown> => !!r);
  for (const r of [...roots]) for (const k of ["data", "resource", "payload"]) if (obj(r[k])) roots.push(obj(r[k])!);
  let postId: string | null = id(query.get("post_id"));
  let commentId: string | null = id(query.get("comment_id"));
  for (const r of roots) {
    postId ??= id(r.post_id) ?? id(obj(r.post)?.id) ?? id(obj(r.comment)?.post_id) ?? id(obj(obj(r.comment)?.post)?.id);
    commentId ??= id(r.comment_id) ?? id(obj(r.comment)?.id);
    if (r.resource_type === "Post" || r.record_type === "Post") postId ??= id(r.resource_id ?? r.record_id ?? r.id);
    if (r.resource_type === "Comment" || r.record_type === "Comment") commentId ??= id(r.resource_id ?? r.record_id ?? r.id);
  }
  return { postId, commentId };
}

/** Header first; a ?secret= query value only for senders that cannot set headers. Constant-time compare. */
export function secretMatches(req: { headers: Headers; url: string }, expected: string | undefined): boolean {
  if (!expected) return false;
  const auth = req.headers.get("authorization");
  const provided =
    req.headers.get("x-webhook-secret") ?? (auth?.startsWith("Bearer ") ? auth.slice(7) : null) ?? new URL(req.url).searchParams.get("secret");
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
