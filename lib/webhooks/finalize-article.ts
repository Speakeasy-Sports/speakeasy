// Runs after the Sanity webhook has revalidated: sets status on publish and keeps the Circle post in step
// (AGENTS.md section 5, Studio configuration, and 7.2). Dependencies are passed in so this is unit tested
// without Sanity, Circle, or KV.
import { buildPostContent, NATIONAL_KEEPS_POST, type CirclePostContent, type SyncableArticle } from "@/lib/circle/post";

export type SyncArticle = SyncableArticle & { status: string | null; publishedAt: string | null; circleSyncError: string | null };

export type Patch = { set: Record<string, unknown>; setIfMissing: Record<string, unknown>; unset: string[] };

export type FinalizeDeps = {
  fetchArticle(id: string): Promise<{ article: SyncArticle | null; versions: string[] }>;
  /** Applies `published` to the published document and `versions` to its drafts and release versions, atomically. */
  commit(id: string, published: Patch, versions: { ids: string[]; patch: Patch }): Promise<void>;
  lock(key: string, ttlSeconds: number): Promise<{ acquired: boolean; release(): Promise<void> }>;
  circle: {
    enabled: boolean;
    create(c: CirclePostContent): Promise<{ id: string; url: string | null }>;
    update(id: string, c: CirclePostContent): Promise<void>;
  };
  now(): string;
  log(event: string, data: Record<string, unknown>): void;
};

export type FinalizeResult = { statusFlipped: boolean; circle: "created" | "updated" | "unchanged" | "skipped" | "locked" | "error" };

const LOCK_TTL = 30;

export type FinalizeOptions = {
  /** Title or dek changed in this mutation (from the webhook projection). */
  textChanged: boolean;
  /** Set by the daily retry job: try again even though an earlier sync recorded an error. */
  retry?: boolean;
};

async function syncCircle(
  a: SyncArticle,
  { textChanged, retry }: FinalizeOptions,
  deps: FinalizeDeps,
): Promise<{ result: FinalizeResult["circle"]; set: Record<string, unknown>; unset: string[] }> {
  const none = { set: {}, unset: [] };
  if (!deps.circle.enabled) return { result: "skipped", ...none };
  // National stories never auto-post. One that already had a post (a scope change) keeps it and says so once.
  if (a.scope === "national") return a.circlePostId ? errorResult(a, NATIONAL_KEEPS_POST) : { result: "skipped", ...none };
  // A recorded error waits for the retry job or a real edit. Retrying on every delivery would loop, because writing
  // the error fires the webhook again.
  if (a.circleSyncError && !textChanged && !retry) return { result: "skipped", ...none };
  if (a.circlePostId && !textChanged && !retry) return { result: "unchanged", ...none };
  const content = buildPostContent(a);
  if ("error" in content) return errorResult(a, content.error);
  try {
    if (!a.circlePostId) {
      const post = await deps.circle.create(content);
      return {
        result: "created",
        set: { circlePostId: post.id, ...(post.url ? { circlePostUrl: post.url } : {}), circleSyncedAt: deps.now() },
        unset: ["circleSyncError"],
      };
    }
    await deps.circle.update(a.circlePostId, content);
    return { result: "updated", set: { circleSyncedAt: deps.now() }, unset: ["circleSyncError"] };
  } catch (err) {
    // Recorded on the article, not retried here. The daily retry job picks up anything with an error.
    return errorResult(a, (err instanceof Error ? err.message : String(err)).slice(0, 500));
  }
}

function errorResult(a: SyncArticle, message: string) {
  // Writing the same error again would only fire another webhook.
  return { result: "error" as const, set: a.circleSyncError === message ? {} : { circleSyncError: message }, unset: [] };
}

export async function finalizePublishedArticle(id: string, options: FinalizeOptions, deps: FinalizeDeps): Promise<FinalizeResult> {
  // The lock covers the read too, so a second delivery sees the circlePostId the first one wrote.
  const lock = await deps.lock(`circle-sync:${id}`, LOCK_TTL);
  try {
    const { article, versions } = await deps.fetchArticle(id);
    if (!article) return { statusFlipped: false, circle: "skipped" };

    const published: Patch = { set: {}, setIfMissing: {}, unset: [] };
    const flip = article.status !== "published";
    if (flip) {
      published.set.status = "published";
      if (!article.publishedAt) published.setIfMissing.publishedAt = deps.now();
    }

    let circle: FinalizeResult["circle"] = "locked";
    let circleSet: Record<string, unknown> = {};
    let circleUnset: string[] = [];
    if (lock.acquired) {
      const r = await syncCircle(article, options, deps);
      circle = r.result;
      circleSet = r.set;
      circleUnset = r.unset;
    }
    Object.assign(published.set, circleSet);
    published.unset.push(...circleUnset);

    // Circle fields and publishedAt also go on any open draft or scheduled version. Publishing one replaces the
    // whole document, and without them it would drop circlePostId (a duplicate post) and reset publishedAt.
    // status stays as the editor left it on the draft.
    const versionPatch: Patch = { set: circleSet, setIfMissing: { ...published.setIfMissing }, unset: circleUnset };

    const changed = Object.keys(published.set).length + Object.keys(published.setIfMissing).length + published.unset.length > 0;
    if (changed) await deps.commit(id, published, { ids: versions, patch: versionPatch });
    deps.log("article_finalized", { id, statusFlipped: flip, circle, versions: versions.length });
    return { statusFlipped: flip, circle };
  } finally {
    await lock.release();
  }
}
