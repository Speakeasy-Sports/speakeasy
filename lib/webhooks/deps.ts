import "server-only";
import { revalidateTag } from "next/cache";
import { circlePosts, circleSyncEnabled } from "@/lib/circle/admin";
import { acquireLock } from "@/lib/kv/lock";
import { getWriteClient } from "@/lib/sanity/write-client";
import { ARTICLE_BY_CIRCLE_POST_QUERY, ARTICLE_SYNC_QUERY } from "@/lib/sanity/queries";
import type { CountDeps } from "./comment-count";
import type { FinalizeDeps, Patch } from "./finalize-article";

const log = (event: string, data: Record<string, unknown>) => console.log(JSON.stringify({ event, ...data }));

function apply(patch: Patch) {
  return (p: ReturnType<ReturnType<typeof getWriteClient>["patch"]>) => {
    let out = p;
    if (Object.keys(patch.set).length) out = out.set(patch.set);
    if (Object.keys(patch.setIfMissing).length) out = out.setIfMissing(patch.setIfMissing);
    if (patch.unset.length) out = out.unset(patch.unset);
    return out;
  };
}

const isEmpty = (p: Patch) => !Object.keys(p.set).length && !Object.keys(p.setIfMissing).length && !p.unset.length;

/** Production wiring for finalizePublishedArticle. `route` labels the Admin API calls in the logs and usage counts. */
export function finalizeDeps(route: string): FinalizeDeps {
  const client = getWriteClient();
  return {
    async fetchArticle(id) {
      const r = await client.fetch(ARTICLE_SYNC_QUERY, { id });
      return { article: r.article, versions: r.versions };
    },
    async commit(id, published, versions) {
      let tx = client.transaction().patch(id, apply(published));
      if (!isEmpty(versions.patch)) for (const v of versions.ids) tx = tx.patch(v, apply(versions.patch));
      await tx.commit({ autoGenerateArrayKeys: true });
    },
    lock: acquireLock,
    circle: {
      enabled: circleSyncEnabled(),
      create: (c) => circlePosts.create(c, route),
      update: (id, c) => circlePosts.update(id, c, route),
    },
    now: () => new Date().toISOString(),
    log,
  };
}

/** Production wiring for refreshCommentCount. `route` labels the Admin API calls in the logs and usage counts. */
export function countDeps(route: string): CountDeps {
  const client = getWriteClient();
  return {
    async findArticle(postId) {
      return client.fetch(ARTICLE_BY_CIRCLE_POST_QUERY, { postId });
    },
    async writeCount(ids, count) {
      let tx = client.transaction();
      for (const id of ids) tx = tx.patch(id, (p) => p.set({ circleCommentCount: count }));
      await tx.commit();
    },
    commentCount: (postId) => circlePosts.commentCount(postId, route),
    postIdForComment: (commentId) => circlePosts.postIdForComment(commentId, route),
    lock: acquireLock,
    revalidate: (tag) => revalidateTag(tag, { expire: 0 }),
    log,
  };
}
