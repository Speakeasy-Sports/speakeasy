import "server-only";
import { circlePosts, circleSyncEnabled } from "@/lib/circle/admin";
import { acquireLock } from "@/lib/kv/lock";
import { getWriteClient } from "@/lib/sanity/write-client";
import { ARTICLE_SYNC_QUERY } from "@/lib/sanity/queries";
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

/** Production wiring for finalizePublishedArticle. */
export function finalizeDeps(): FinalizeDeps {
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
    circle: { enabled: circleSyncEnabled(), create: circlePosts.create, update: circlePosts.update },
    now: () => new Date().toISOString(),
    log,
  };
}
