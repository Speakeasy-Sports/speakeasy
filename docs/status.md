# Build status

Running record of what is built, what is deferred, and decisions still open. Update at the end of each session.

## Phase 1, week 1 (done October 19, 2026)

Built and verified (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm check:secrets`, Playwright smoke against the mock dataset):

- Next.js 16 App Router, TypeScript strict, Tailwind v4, tokens from AGENTS.md section 8, placeholder serif (Source Serif 4 variable, 100KB for both faces).
- Sanity schemas for every type in section 5, desk structure by status, validation rules, Studio at `/studio`, Presentation tool wired to `/api/draft`, TypeGen output committed as `sanity.types.ts`.
- Article page complete: labels, headline, dek, byline with relative time, image or embed hero, episode notes, sponsor slot, Portable Text with every custom block, correction, discuss button, author card, newsletter form, related stories, NewsArticle and BreadcrumbList JSON-LD, canonical redirect for secondary schools.
- OG image route at `/api/og?slug=`.
- Minimal home (Latest list) and school section so links resolve. Full layouts are week 2.
- `scripts/mock-sanity.mjs` plus fixtures so the site builds and the smoke tests run without a Sanity project.

## Deferred to week 2 (per AGENTS.md section 12)

- Home lead story, secondary row, pagination. School sub-nav and tag filters.
- Author, tag, podcasts, videos, search, newsletter, about, contact, terms, privacy pages.
- Feeds, sitemap, robots, WordPress redirects.
- `/api/webhooks/sanity` (revalidation, `status` flip, Circle post), `/api/webhooks/circle`, `/api/newsletter` (the form already posts there and shows an error until it exists).
- Postmark review notifications.

## Not possible from the repo

- Creating the Sanity project, tokens, CORS origins, and roles. See `docs/setup.md`.
- Creating the Vercel project and env vars.
- Brand fonts and mark (V7). `lib/fonts.ts` and `app/icon.svg` are placeholders.

## Open decisions

1. **JS budget.** AGENTS.md section 10 asks for under 90KB gzipped on the article page. The measured page ships 187KB gzipped: about 150KB is the React 19 and Next.js 16 runtime, which no page can avoid, and about 35KB is site code (embeds, newsletter form, analytics). The 90KB number predates this stack. Recommendation: set the budget to 200KB total and 40KB for site code, and hold the line there.
3. **V9** (Admin API budget vs. the hourly comment-count fallback) is still open in AGENTS.md section 13.
