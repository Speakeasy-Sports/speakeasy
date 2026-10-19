#!/usr/bin/env node
// Fails the build when published content has an image without alt text (AGENTS.md sections 10 and 14).
// The Studio already requires alt; this catches content imported or edited around it. Pages also refuse to render
// an image without alt, so content published after a build degrades to a missing image, never to an unlabeled one.
//
// Skipped (with a note) when no Sanity project is configured. Runs against scripts/mock-sanity.mjs when
// SANITY_API_HOST points at it.
import { createClient } from "@sanity/client";
import { pathToFileURL } from "node:url";

const PUBLISHED = `!(_id in path("drafts.**")) && !(_id in path("versions.**"))`;
const MISSING = (img) => `(defined(${img}.asset) && coalesce(${img}.alt, "") == "")`;
const BODY_MISSING = `count(body[_type == "imageBlock" && defined(asset) && coalesce(alt, "") == ""]) > 0`;

export const ALT_TEXT_QUERY = `[
  ...*[_type == "article" && ${PUBLISHED} && (${BODY_MISSING} || ${MISSING("heroImage")} || ${MISSING("ogImageOverride")})]
    { _id, _type, "label": title },
  ...*[_type == "infoPage" && ${PUBLISHED} && ${BODY_MISSING}] { _id, _type, "label": title },
  ...*[_type == "author" && ${PUBLISHED} && ${MISSING("photo")}] { _id, _type, "label": name },
  ...*[_type == "school" && ${PUBLISHED} && (${MISSING("logo")} || ${MISSING("heroImage")})] { _id, _type, "label": name },
  ...*[_type == "sponsorSlot" && ${PUBLISHED} && ${MISSING("logo")}] { _id, _type, "label": coalesce(sponsorName, name) },
  ...*[_type == "siteSettings" && ${PUBLISHED} && ${MISSING("defaultOgImage")}] { _id, _type, "label": "Site settings" }
]`;

export function report(problems) {
  if (!problems.length) return { ok: true, text: "check-alt-text: ok" };
  const lines = problems.map((p) => `  ${p._type} "${p.label ?? p._id}" (${p._id})`);
  return { ok: false, text: ["check-alt-text: FAILED, images without alt text:", ...lines, "Add alt text in the Studio and rebuild."].join("\n") };
}

async function main() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  if (!projectId) {
    console.log("check-alt-text: no NEXT_PUBLIC_SANITY_PROJECT_ID, skipped");
    return;
  }
  const apiHost = process.env.SANITY_API_HOST;
  const client = createClient({
    projectId,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
    apiVersion: "2026-10-01",
    useCdn: false,
    perspective: "published",
    token: process.env.SANITY_API_READ_TOKEN || undefined,
    ...(apiHost ? { apiHost, useProjectHostname: false } : {}),
  });
  const { ok, text } = report(await client.fetch(ALT_TEXT_QUERY));
  (ok ? console.log : console.error)(text);
  if (!ok) process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((err) => {
    console.error(`check-alt-text: could not query Sanity: ${err.message}`);
    process.exit(1);
  });
}
