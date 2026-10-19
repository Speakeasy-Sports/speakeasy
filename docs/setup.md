# Setup

What you need to do once, outside the repo, before the site runs against real content. AGENTS.md is the spec; this is the checklist.

## 1. Sanity project (Growth plan)

1. Create the project at sanity.io/manage. Dataset: `production`. Note the project ID.
2. Roles: Jon = Administrator. Trusted editors = Editor. Writers = Contributor (can create and edit, cannot publish).
3. CORS origins: add `http://localhost:3000` and `https://speakeasysports.com` (and the Vercel preview domain pattern) with credentials allowed, so the embedded Studio at `/studio` can log in.
4. Tokens (Settings > API > Tokens):
   - Viewer token for draft mode: `SANITY_API_READ_TOKEN`
   - Editor token for the Circle sync writes: `SANITY_API_WRITE_TOKEN` (server only, never in `NEXT_PUBLIC_*`)
5. Enable Scheduled Publishing (Growth feature) in the project settings so editors can schedule.
6. After the first deploy, open `/studio`, create the singleton under Settings, add the Georgia school, an author, and a tag.

The schema lives in `sanity/schemas`. `pnpm typegen` regenerates `sanity.types.ts`; commit it.

## 2. Vercel project

1. Import the GitHub repo. Framework preset: Next.js. Build command `pnpm build`.
2. Environment variables: everything in `.env.example`. Mark the token and secret values as sensitive. Preview deploys need `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_READ_TOKEN`, and `NEXT_PUBLIC_SITE_URL` at minimum.
3. Domains: `speakeasysports.com` (apex) and `www` redirecting to apex. DNS stays at Cloudflare, DNS only (gray cloud) for the Vercel records.
4. Protect previews with Vercel Authentication so unpublished layouts are not indexed.

## 3. Local development

```bash
cp .env.example .env.local   # fill in project id and read token
pnpm install
pnpm dev                     # site on :3000, Studio on :3000/studio
```

Checks a contributor runs before a PR:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build && pnpm check:secrets
```

## 4. Local smoke test without a Sanity project

`scripts/mock-sanity.mjs` answers the site's GROQ queries from `scripts/fixtures/sanity.json`. Useful for Playwright and for checking the build in CI before the project exists.

```bash
node scripts/mock-sanity.mjs 3999 &
export SANITY_API_HOST=http://127.0.0.1:3999 NEXT_PUBLIC_SANITY_PROJECT_ID=mock1234
rm -rf .next   # the build fetch cache in .next/cache survives between builds and will replay old mock answers
pnpm build && pnpm start &
pnpm test:e2e
```

## 5. Week 2 hooks (not yet built)

- Sanity webhook to `/api/webhooks/sanity` (revalidation, status flip, Circle post). Filter `_type == "article"`, secret in `SANITY_WEBHOOK_SECRET`.
- Circle Workflow webhook to `/api/webhooks/circle` with `CIRCLE_WEBHOOK_SECRET`.
- Newsletter handler at `/api/newsletter`. The signup form already posts there.

Cache tag vocabulary the webhook must use is in `lib/sanity/tags.ts`.
