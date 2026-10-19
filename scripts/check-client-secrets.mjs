#!/usr/bin/env node
// Fails if a server-only token could reach the browser (AGENTS.md section 14).
// 1. Source: no client component or shared lib may import lib/sanity/token.
// 2. Build output: .next/static must not contain the secret env var names or their values.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const SECRET_ENV = ["SANITY_API_WRITE_TOKEN", "SANITY_API_READ_TOKEN", "CIRCLE_ADMIN_API_TOKEN", "CIRCLE_WEBHOOK_SECRET", "SANITY_WEBHOOK_SECRET", "POSTMARK_SERVER_TOKEN", "TURNSTILE_SECRET_KEY"];
const SOURCE_DIRS = ["app", "components", "lib", "sanity"];
const SOURCE_EXT = /\.(ts|tsx|js|jsx|mjs)$/;

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const failures = [];

// 1. Source check
for (const dir of SOURCE_DIRS) {
  for (const file of walk(join(root, dir)).filter((f) => SOURCE_EXT.test(f))) {
    const text = readFileSync(file, "utf8");
    const isClient = /^\s*["']use client["']/m.test(text);
    const importsToken = /from\s+["'](@\/)?(\.\.?\/)*lib\/sanity\/token["']/.test(text) || /["'].*\/token["']/.test(text) && /lib\/sanity\/token/.test(text);
    if (isClient && importsToken) failures.push(`${relative(root, file)}: client component imports lib/sanity/token`);
    if (isClient && SECRET_ENV.some((k) => text.includes(`process.env.${k}`))) {
      failures.push(`${relative(root, file)}: client component reads a secret env var`);
    }
  }
}

// 2. Bundle check
const staticDir = join(root, ".next", "static");
if (existsSync(staticDir)) {
  const values = SECRET_ENV.map((k) => process.env[k]).filter((v) => v && v.length >= 12);
  for (const file of walk(staticDir).filter((f) => /\.(js|css|json|txt)$/.test(f))) {
    const text = readFileSync(file, "utf8");
    for (const k of SECRET_ENV) if (text.includes(k)) failures.push(`${relative(root, file)}: contains ${k}`);
    for (const v of values) if (text.includes(v)) failures.push(`${relative(root, file)}: contains the value of a secret env var`);
  }
} else {
  console.log("check-client-secrets: no .next/static found, skipped bundle scan");
}

if (failures.length) {
  console.error("check-client-secrets: FAILED");
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log("check-client-secrets: ok");
