#!/usr/bin/env node
// Stand-in for the Sanity query API so the site can build and run without a project.
// Matches each GROQ query in lib/sanity/queries.ts by a distinctive fragment and serves fixtures.
// Usage: node scripts/mock-sanity.mjs [port]   then   SANITY_API_HOST=http://127.0.0.1:3999 NEXT_PUBLIC_SANITY_PROJECT_ID=mock1234 pnpm build
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(readFileSync(join(here, "fixtures", "sanity.json"), "utf8"));
const port = Number(process.argv[2] ?? process.env.MOCK_SANITY_PORT ?? 3999);

function resolve(query, params) {
  const q = query.replace(/\s+/g, " ");
  if (q.includes('_id == "siteSettings"')) return fixtures.settings;
  if (q.includes('"school": primarySchool->{ shortName, accentColor')) {
    const a = fixtures.articles.find((x) => x.slug === params.slug);
    return a ? { title: a.title, dek: a.dek, contentType: a.contentType, school: a.school, authors: a.authors.map((x) => ({ name: x.name })) } : null;
  }
  if (q.includes("slug.current == $slug][0]{ _id, _updatedAt,")) {
    return fixtures.articles.find((x) => x.slug === params.slug) ?? null;
  }
  if (q.includes('_type == "school" && slug.current == $slug')) {
    return fixtures.schools.find((s) => s.slug === params.slug) ?? null;
  }
  if (q.includes('_type == "school" && defined(slug.current)')) {
    return fixtures.schools.map((s) => ({ slug: s.slug }));
  }
  if (q.includes("$schoolId in schools[]._ref")) {
    return fixtures.cards.filter((c) => c.school._id === params.schoolId);
  }
  if (q.includes("[0...20]")) return fixtures.cards;
  if (q.includes('"school": primarySchool->slug.current')) return fixtures.cards.map((c) => ({ slug: c.slug, school: c.school.slug }));
  return null;
}

function parseParams(searchParams, body) {
  const params = { ...(body?.params ?? {}) };
  for (const [k, v] of searchParams) {
    if (k.startsWith("$")) {
      try {
        params[k.slice(1)] = JSON.parse(v);
      } catch {
        params[k.slice(1)] = v;
      }
    }
  }
  return params;
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    let body = null;
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch {
        body = null;
      }
    }
    if (!/\/data\/query\//.test(url.pathname)) {
      res.writeHead(404, { "content-type": "application/json" });
      return res.end(JSON.stringify({ error: "mock-sanity: only /data/query is implemented" }));
    }
    const query = body?.query ?? url.searchParams.get("query") ?? "";
    const params = parseParams(url.searchParams, body);
    const result = resolve(query, params);
    const label = query.replace(/\s+/g, " ").slice(0, 70);
    const paramLabel = Object.keys(params).length ? ` ${JSON.stringify(params)}` : "";
    console.log(`${req.method} ${result === null ? "null" : Array.isArray(result) ? `${result.length} items` : "doc"}  ${label}${paramLabel}`);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ result, ms: 1 }));
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`mock-sanity listening on http://127.0.0.1:${port}`);
});
