#!/usr/bin/env node
// One-time migration for the Phase 1 UX update (docs/specs/phase-1-ux-update.md, 3.6). Safe to run twice.
//
//   pnpm migrate:scope --dry-run   report what would change, write nothing
//   pnpm migrate:scope             apply
//
// - Every article without coverageScope becomes a school story (its URL does not change).
// - heroType is filled in only where it is missing: "image" when a hero image exists, otherwise "none".
//   Existing hero types are never changed.
// - Site settings gets homepageLead (a weak reference) from the current rank-one featured story, if the field is
//   empty. The Site settings document is created if it does not exist yet.
// - featured and featuredRank stay on the documents; the Studio hides them.
// Needs NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN (read from .env.local if present).
import { createClient } from "@sanity/client";

const dryRun = process.argv.includes("--dry-run");
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!projectId || !token) {
  console.error("Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN (for example in .env.local).");
  process.exit(1);
}
// The raw perspective includes drafts and release versions, which need the same fields.
const client = createClient({ projectId, dataset, token, apiVersion: "2026-10-01", useCdn: false, perspective: "raw" });

async function main() {
  const { articles, settings, rankOne } = await client.fetch(`{
    "articles": *[_type == "article" && (!defined(coverageScope) || !defined(heroType))]{
      _id, coverageScope, heroType, "hasImage": defined(heroImage.asset)
    },
    "settings": *[_id == "siteSettings"][0]{ _id, "lead": homepageLead._ref },
    "rankOne": *[
      _type == "article" && featured == true && featuredRank == 1
      && !(_id in path("drafts.**")) && !(_id in path("versions.**"))
    ] | order(coalesce(publishedAt, _createdAt) desc)[0]{ _id, title }
  }`);

  const patches = articles.map((a) => {
    const set = {};
    if (!a.coverageScope) set.coverageScope = "school";
    if (!a.heroType) set.heroType = a.hasImage ? "image" : "none";
    return { id: a._id, set };
  });

  let lead = null;
  if (!settings?.lead && rankOne) lead = rankOne;

  console.log(`${dryRun ? "Dry run on" : "Migrating"} ${projectId}/${dataset}`);
  console.log(`- Articles to update: ${patches.length}`);
  for (const p of patches) console.log(`    ${p.id}: ${JSON.stringify(p.set)}`);
  console.log(`- Site settings document: ${settings ? "exists" : "missing, will be created"}`);
  console.log(
    settings?.lead
      ? "- homepageLead: already set, left alone"
      : lead
        ? `- homepageLead: set to "${lead.title}" (${lead._id}), the current rank-one featured story`
        : "- homepageLead: no rank-one featured story; left empty (the home page leads with the newest story)",
  );
  if (dryRun) return;

  const tx = client.transaction();
  for (const p of patches) tx.patch(p.id, (patch) => patch.set(p.set));
  if (!settings) tx.createIfNotExists({ _id: "siteSettings", _type: "siteSettings", siteName: "Speakeasy Sports" });
  if (lead) tx.patch("siteSettings", (patch) => patch.set({ homepageLead: { _type: "reference", _ref: lead._id, _weak: true } }));
  if (patches.length || !settings || lead) await tx.commit({ visibility: "async" });

  const remaining = await client.fetch(`count(*[_type == "article" && (!defined(coverageScope) || !defined(heroType))])`);
  console.log(remaining === 0 ? "Done. Every article has coverageScope and heroType." : `Done, but ${remaining} articles still lack a field. Run again.`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
