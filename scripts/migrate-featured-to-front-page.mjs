#!/usr/bin/env node
// Moves home page curation from article.featured/featuredRank to the Front page document (AGENTS.md sections 5 and 6).
//
// Two steps, so the live site never loses its lead story:
//   1. Before the front-page curation deploy:  node scripts/migrate-featured-to-front-page.mjs --apply
//      Copies today's featured ranks 1 to 4 into frontPage.topStories, in the order the site shows them now (rank,
//      then newest first on a tied rank). The old site ignores this document; the new one reads it from the first request.
//   2. After the deploy is live:               node scripts/migrate-featured-to-front-page.mjs --apply --unset-old
//      Removes featured and featuredRank from every article, drafts and scheduled versions included.
//
// Without --apply it prints what it would do and writes nothing. It refuses to replace a Front page that already has
// picks unless --force is passed. School fronts need no migration: with no picks of their own they inherit the home
// picks that cover the school, which is what featured ranks did.
//
// Needs NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, and SANITY_API_WRITE_TOKEN.
import { createClient } from "@sanity/client";
import { pathToFileURL } from "node:url";

export const FEATURED_QUERY = `*[
  _type == "article" && featured == true && featuredRank in 1..4
  && defined(slug.current) && defined(primarySchool)
] | order(featuredRank asc, coalesce(publishedAt, _createdAt) desc){ _id, title, featuredRank }`;

export const OLD_FIELDS_QUERY = `*[_type == "article" && (defined(featured) || defined(featuredRank))]._id`;

/** The first four featured articles, as weak references in front-page order. */
export function planPicks(featured) {
  return featured.slice(0, 4).map((a, i) => ({ _type: "reference", _ref: a._id, _weak: true, _key: `pick${i + 1}` }));
}

export function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

async function main(args) {
  const apply = args.includes("--apply");
  const unsetOld = args.includes("--unset-old");
  const force = args.includes("--force");
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!projectId || !token) throw new Error("set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN");

  const apiHost = process.env.SANITY_API_HOST;
  const base = {
    projectId,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
    apiVersion: "2026-10-01",
    useCdn: false,
    token,
    ...(apiHost ? { apiHost, useProjectHostname: false } : {}),
  };
  const published = createClient({ ...base, perspective: "published" });
  const raw = createClient({ ...base, perspective: "raw" });
  const say = (msg) => console.log(`${apply ? "" : "[dry run] "}${msg}`);

  if (unsetOld) {
    const ids = await raw.fetch(OLD_FIELDS_QUERY);
    say(`remove featured and featuredRank from ${ids.length} article documents`);
    if (apply) {
      for (const batch of chunk(ids, 100)) {
        const tx = raw.transaction();
        for (const id of batch) tx.patch(id, (p) => p.unset(["featured", "featuredRank"]));
        await tx.commit({ visibility: "async" });
      }
    }
    return;
  }

  const existing = await published.fetch(`*[_id == "frontPage"][0]{ "count": count(topStories) }`);
  if (existing?.count > 0 && !force) {
    throw new Error(`the Front page already has ${existing.count} picks; pass --force to replace them`);
  }
  const featured = await published.fetch(FEATURED_QUERY);
  const picks = planPicks(featured);
  if (featured.length > 4) say(`${featured.length} articles are featured; only the first four were on the front page`);
  say(`Front page top stories: ${picks.length ? "" : "none (the site will show the four newest)"}`);
  featured.slice(0, 4).forEach((a, i) => say(`  ${i + 1}. ${a.title} (rank ${a.featuredRank}, ${a._id})`));
  if (apply) {
    await raw
      .transaction()
      .createIfNotExists({ _id: "frontPage", _type: "frontPage" })
      .patch("frontPage", (p) => p.set({ topStories: picks }))
      .commit();
    say("done. Run again with --unset-old after the deploy is live.");
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(`migrate-featured-to-front-page: ${err.message}`);
    process.exit(1);
  });
}
