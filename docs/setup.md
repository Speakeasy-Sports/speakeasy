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

`scripts/mock-sanity.mjs` evaluates the site's real GROQ queries with groq-js against the documents in `scripts/fixtures/dataset.mjs`, and serves placeholder artwork for images. Useful for Playwright, for design review, and for checking the build in CI before the project exists.

```bash
node scripts/mock-sanity.mjs 3999 &
export SANITY_API_HOST=http://127.0.0.1:3999 NEXT_PUBLIC_SANITY_PROJECT_ID=mock1234
export NEXT_PUBLIC_MOCK_ASSET_ORIGIN=http://127.0.0.1:3999   # placeholder art instead of cdn.sanity.io; never set in a real deploy
rm -rf .next   # the build fetch cache in .next/cache survives between builds and will replay old mock answers
pnpm build && pnpm start &
pnpm test:e2e
```

## 5. Sanity webhooks

Create both in sanity.io/manage, project, API, Webhooks. Both: dataset `production`, HTTP method POST, URL `https://speakeasysports.com/api/webhooks/sanity`, API version `v2025-02-19` or later, secret = `SANITY_WEBHOOK_SECRET`, and this projection:

```groq
{
  "_id": _id,
  "_type": _type,
  "operation": delta::operation(),
  "slug": coalesce(after().slug.current, before().slug.current),
  "previousSlug": before().slug.current,
  "status": after().status,
  "previousStatus": before().status,
  "textChanged": delta::changedAny((title, dek))
}
```

| Webhook | Trigger on | Filter | Drafts | Versions |
|---|---|---|---|---|
| Site publish | Create, Update, Delete | `_type in ["article", "school", "author", "tag", "infoPage", "siteSettings", "sponsorSlot"] && !(delta::operation() == "update" && delta::changedOnly(circleCommentCount))` | Off | Off |
| Review notification | Create, Update | `_type == "article" && status == "review" && delta::changedAny(status)` | On | Off |

What the handler does:
- Site publish: revalidates the cache tags in `lib/sanity/tags.ts` before responding. For an article it then sets `status` to `published` (and `publishedAt` if empty) and syncs the Circle post, in one transaction that also copies the Circle fields onto any open draft or scheduled version. The echo delivery from that write changes nothing.
- Review notification: emails `EDITOR_NOTIFY_EMAIL` through Postmark with a Studio link.

Needed env vars: `SANITY_WEBHOOK_SECRET`, `SANITY_API_WRITE_TOKEN` (Editor role token), `KV_REST_API_URL` and `KV_REST_API_TOKEN` (the lock), Postmark vars for the email. Circle sync stays off until `CIRCLE_SYNC_ENABLED=true`; turn it on after one test post (checklist in `docs/circle-api-notes.md`). Each step logs one JSON line (`sanity_webhook`, `article_finalized`, `circle_admin_api`, `review_notified`) in the Vercel function logs.

The `changedOnly(circleCommentCount)` clause keeps comment-count writes from the Circle webhook (which revalidates the one article itself) from refreshing the whole site.

## 6. Circle comment counts and the daily job

Circle Workflow (Circle admin, Workflows, New workflow), once for each trigger "comment created" and "post updated" if offered:
- Action: send a webhook to `https://speakeasysports.com/api/webhooks/circle`.
- Auth: a header `x-webhook-secret: <CIRCLE_WEBHOOK_SECRET>`. If the action cannot set headers, append `?secret=<CIRCLE_WEBHOOK_SECRET>` to the URL instead.
- Body: include the post id (`post_id` or `post.id`). A comment id alone also works and costs one extra Admin API call. If the first live event returns 400, the `circle_webhook_unrecognized` log line lists the keys Circle sent; adjust `extractIds` in `lib/webhooks/circle-payload.ts`.

The handler ignores posts the site did not create, reads at most one count per post every 30 seconds, writes `circleCommentCount`, and revalidates that article.

Daily job (`vercel.json`, 9:17 UTC, `/api/cron/circle-daily`, needs `CRON_SECRET`):
- Retries articles with `circleSyncError`, and posts articles from the last 3 days that never got a Circle post (older ones are skipped so turning sync on never floods a space).
- Refreshes comment counts for articles from the last 7 days, which catches anything a webhook missed.
- Mondays: logs `circle_admin_api_weekly` with last week's Admin API calls by route (counted in KV).

If Workflows cannot send webhooks (V5), change the cron schedule to every few hours; see V9 in AGENTS.md for the budget call.

## 7. Still to build

- Newsletter handler at `/api/newsletter`. The signup form already posts there.
