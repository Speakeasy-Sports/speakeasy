#!/usr/bin/env node
// Seeds the dataset with sample stories so production can be tested before launch, and removes them again.
//
//   pnpm seed              add or refresh the samples (safe to run twice)
//   pnpm seed --remove     delete every sample document and its images
//   pnpm seed --dry-run    print what would be written, touching nothing
//
// Needs NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN (read from .env.local if present).
// Sample documents have ids starting "seed-" and are marked noIndex, so they stay out of the sitemap and search
// index, and --remove never touches anything else. Existing Georgia, author, and tag documents are reused by slug.
// Run --remove before setting CIRCLE_SYNC_ENABLED=true, or each sample gets a Circle post.
import { readFile } from "node:fs/promises";
import { createClient } from "@sanity/client";
import { stories } from "./seed-content.mjs";

const PREFIX = "seed-";
const SOURCE = "speakeasy-seed";
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const remove = args.has("--remove");

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!dryRun && (!projectId || !token)) {
  console.error("Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN (for example in .env.local).");
  process.exit(1);
}
const client = dryRun ? null : createClient({ projectId, dataset, token, apiVersion: "2026-10-01", useCdn: false });

const TAGS = {
  defense: "Defense",
  quarterbacks: "Quarterbacks",
  recruiting: "Recruiting",
  "film-room": "Film room",
  basketball: "Basketball",
};

const ref = (_ref) => ({ _type: "reference", _ref });
let keyN = 0;
const key = () => `s${(keyN++).toString(36)}`;
const span = (text) => ({ _type: "span", _key: key(), text, marks: [] });
const block = (style, text, extra = {}) => ({ _type: "block", _key: key(), style, markDefs: [], children: [span(text)], ...extra });

function toBody(items) {
  const out = [];
  for (const item of items) {
    if (typeof item === "string") out.push(block("normal", item));
    else if (item[0] === "h2") out.push(block("h2", item[1]));
    else if (item[0] === "bullets") for (const b of item[1]) out.push(block("normal", b, { listItem: "bullet", level: 1 }));
    else if (item[0] === "quote") out.push({ _type: "pullQuote", _key: key(), text: item[1] });
    else if (item[0] === "callout") out.push({ _type: "callout", _key: key(), title: item[1], body: item[2], variant: "info" });
  }
  out.push({
    _type: "callout",
    _key: key(),
    title: "Sample story",
    body: "This is placeholder content for testing the site before launch. It will be removed.",
    variant: "note",
  });
  return out;
}

async function existingBySlug(type, slug) {
  if (dryRun) return null;
  return client.fetch(`*[_type == $type && slug.current == $slug && !(_id in path("drafts.**"))][0]._id`, { type, slug });
}

async function uploadImages() {
  const used = [...new Set(stories.map((s) => s.image).filter(Boolean))];
  const ids = {};
  for (const n of used) {
    const file = `sample-${n}.jpg`;
    if (dryRun) {
      ids[n] = `image-dry-run-${n}`;
      continue;
    }
    const bytes = await readFile(new URL(`./seed-assets/${file}`, import.meta.url));
    const asset = await client.assets.upload("image", bytes, { filename: file, source: { name: SOURCE, id: file } });
    ids[n] = asset._id;
  }
  return ids;
}

async function seed() {
  const docs = [];

  let schoolId = await existingBySlug("school", "georgia");
  if (!schoolId) {
    schoolId = `${PREFIX}school-georgia`;
    docs.push({
      _id: schoolId,
      _type: "school",
      name: "Georgia Bulldogs",
      shortName: "Georgia",
      slug: { _type: "slug", current: "georgia" },
      mascot: "Bulldogs",
      accentColor: "#BA0C2F",
      accentColorDark: "#E44A64",
      communityName: "Dawg Social Club",
      order: 1,
    });
  }

  let authorId = await existingBySlug("author", "jon-smith");
  if (!authorId) {
    authorId = `${PREFIX}author-jon-smith`;
    docs.push({ _id: authorId, _type: "author", name: "Jon Smith", slug: { _type: "slug", current: "jon-smith" }, role: "Founder" });
  }

  const tagIds = {};
  for (const [slug, name] of Object.entries(TAGS)) {
    tagIds[slug] = (await existingBySlug("tag", slug)) ?? `${PREFIX}tag-${slug}`;
    if (tagIds[slug].startsWith(PREFIX)) docs.push({ _id: tagIds[slug], _type: "tag", name, slug: { _type: "slug", current: slug } });
  }

  const images = await uploadImages();
  const now = Date.now();

  for (const s of stories) {
    const published = new Date(now - s.hoursAgo * 3600_000).toISOString();
    docs.push({
      _id: `${PREFIX}article-${s.slug}`,
      _type: "article",
      title: s.title,
      slug: { _type: "slug", current: s.slug },
      dek: s.dek,
      contentType: s.type,
      coverageScope: s.scope === "national" ? "national" : "school",
      // National stories have no primary school; their related schools (if any) still place them on that front.
      schools: s.scope === "national" ? (s.schools ?? []).map(() => ({ ...ref(schoolId), _key: key() })) : [{ ...ref(schoolId), _key: key() }],
      ...(s.scope === "national" ? {} : { primarySchool: ref(schoolId) }),
      authors: [{ ...ref(authorId), _key: key() }],
      tags: s.tags.map((t) => ({ ...ref(tagIds[t]), _key: key() })),
      ...(s.image
        ? {
            heroType: "image",
            heroImage: {
              _type: "image",
              asset: ref(images[s.image]),
              alt: "Abstract color gradient used as a placeholder image",
              credit: "Placeholder image",
            },
          }
        : { heroType: "none" }),
      body: toBody(s.body),
      status: "published",
      publishedAt: published,
      memberOnly: false,
      noIndex: true,
    });
  }

  if (dryRun) {
    console.log(JSON.stringify(docs, null, 2));
    console.log(`Dry run: would write ${docs.length} documents (${stories.length} stories).`);
    return;
  }
  const tx = client.transaction();
  for (const d of docs) tx.createOrReplace(d);
  await tx.commit({ visibility: "async" });
  console.log(`Seeded ${stories.length} sample stories (${docs.length} documents) into ${projectId}/${dataset}.`);
  console.log("The site picks them up within a minute. Remove them with: pnpm seed --remove");
}

async function removeAll() {
  if (dryRun) {
    console.log("Dry run: would delete every document whose id starts with seed-, then the seed images.");
    return;
  }
  const prefixes = { p: PREFIX, d: `drafts.${PREFIX}` };
  const starts = "(string::startsWith(_id, $p) || string::startsWith(_id, $d))";
  // Sample stories first. Then the school, author, and tags the seed created, except any that real content now
  // references (a tag reused by real articles stays, and the run says so).
  const articles = await client.fetch(`*[_type == "article" && ${starts}]._id`, prefixes);
  if (articles.length) {
    const tx = client.transaction();
    for (const id of articles) tx.delete(id);
    await tx.commit();
  }
  const rest = await client.fetch(`*[_type != "article" && ${starts}]{ _id, "used": count(*[references(^._id)]) > 0 }`, prefixes);
  const free = rest.filter((d) => !d.used).map((d) => d._id);
  const kept = rest.filter((d) => d.used).map((d) => d._id);
  if (free.length) {
    const tx = client.transaction();
    for (const id of free) tx.delete(id);
    await tx.commit();
  }
  const assets = await client.fetch(`*[_type == "sanity.imageAsset" && source.name == $s && count(*[references(^._id)]) == 0]._id`, { s: SOURCE });
  if (assets.length) {
    const tx = client.transaction();
    for (const id of assets) tx.delete(id);
    await tx.commit();
  }
  console.log(`Removed ${articles.length} sample stories, ${free.length} other sample documents, and ${assets.length} images from ${projectId}/${dataset}.`);
  if (kept.length) console.log(`Kept because real content uses them: ${kept.join(", ")}`);
}

(remove ? removeAll() : seed()).catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
