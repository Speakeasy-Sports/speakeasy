#!/usr/bin/env node
// Stand-in for the Sanity query API so the site builds and runs without a project.
// Evaluates the site's real GROQ with groq-js against scripts/fixtures/dataset.mjs, and serves placeholder
// artwork for image URLs when the site points NEXT_PUBLIC_SANITY_IMAGE_ORIGIN at it.
//
//   node scripts/mock-sanity.mjs 3999
//   SANITY_API_HOST=http://127.0.0.1:3999 NEXT_PUBLIC_SANITY_PROJECT_ID=mock1234 \
//   NEXT_PUBLIC_SANITY_IMAGE_ORIGIN=http://127.0.0.1:3999 pnpm build
import { createServer } from "node:http";
import { evaluate, parse } from "groq-js";
import { dataset } from "./fixtures/dataset.mjs";

const port = Number(process.argv[2] ?? process.env.MOCK_SANITY_PORT ?? 3999);

function parseParams(searchParams, body) {
  const params = { ...(body?.params ?? {}) };
  for (const [k, v] of searchParams) {
    if (!k.startsWith("$")) continue;
    try {
      params[k.slice(1)] = JSON.parse(v);
    } catch {
      params[k.slice(1)] = v;
    }
  }
  return params;
}

// Deterministic duotone "photo" per image id, so layouts can be judged with real-looking image weight.
function placeholderSvg(id, w, h) {
  let hash = 0;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  const palettes = [
    ["#2b2a28", "#7a2232", "#c9a27a"],
    ["#1d2b33", "#3f6b5c", "#d8cfb4"],
    ["#2a2320", "#8a5a3c", "#e3c9a0"],
    ["#1f1f24", "#4b4f7a", "#c7c2b8"],
    ["#28241f", "#6b6a3a", "#d9d2bf"],
  ];
  const [a, b, c] = palettes[hash % palettes.length];
  const cx = 20 + (hash % 60);
  const cy = 30 + ((hash >> 3) % 40);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">
<defs>
<radialGradient id="g" cx="${cx}%" cy="${cy}%" r="85%"><stop offset="0" stop-color="${c}"/><stop offset=".45" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></radialGradient>
<filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .18 0"/></filter>
</defs>
<rect width="100%" height="100%" fill="url(#g)"/>
<rect width="100%" height="100%" filter="url(#n)"/>
</svg>`;
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

  if (url.pathname.startsWith("/images/") || url.pathname.startsWith("/vi/")) {
    const w = Number(url.searchParams.get("w")) || 1200;
    const h = Number(url.searchParams.get("h")) || Math.round((w * 9) / 16);
    res.writeHead(200, { "content-type": "image/svg+xml", "cache-control": "public, max-age=3600" });
    return res.end(placeholderSvg(url.pathname, w, h));
  }

  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", async () => {
    if (!/\/data\/query\//.test(url.pathname)) {
      res.writeHead(404, { "content-type": "application/json" });
      return res.end(JSON.stringify({ error: "mock-sanity: only /data/query and /images are implemented" }));
    }
    let body = null;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = null;
    }
    const query = body?.query ?? url.searchParams.get("query") ?? "";
    const params = parseParams(url.searchParams, body);
    try {
      const value = await evaluate(parse(query, { params }), { dataset, params, timestamp: new Date() });
      const result = await value.get();
      const label = query.replace(/\s+/g, " ").trim().slice(0, 60);
      const shape = result === null ? "null" : Array.isArray(result) ? `${result.length} items` : typeof result;
      console.log(`${req.method} ${shape}  ${label}${Object.keys(params).length ? ` ${JSON.stringify(params)}` : ""}`);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ result, ms: 1 }));
    } catch (err) {
      console.error("GROQ error:", err.message);
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: { description: err.message, type: "queryParseError" } }));
    }
  });
});

server.listen(port, "127.0.0.1", () => console.log(`mock-sanity listening on http://127.0.0.1:${port}`));
