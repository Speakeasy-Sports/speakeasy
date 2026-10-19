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

### Review fixes (October 19, after the reviewer pass)

- Site queries no longer filter on `status`: live means "exists in the published perspective". Fixes 404s when previewing new drafts and published stories missing from lists before the webhook flips status.
- School and article routes use `generateStaticParams`, so they are SSG plus ISR instead of rendering on every request.
- Related stories use `coalesce(count(shared tags), 0)` so untagged articles no longer sort first.
- Cache tag vocabulary settled in `lib/sanity/tags.ts` (pages tag by slug and collection; handlers revalidate the same). AGENTS.md 7.1 and 7.3 updated to match.
- Hero embed provider is validated against `heroType` (video needs YouTube, podcast must not be YouTube).
- `/api/draft/disable?to=` only follows same-origin paths.
- School accent colors are validated for 4.5:1 in the Studio, and the site derives a passing dark-mode accent when `accentColorDark` is empty. Root dark tokens now define a visible brand accent.
- GROQ queries have a Vitest suite that runs the real queries in groq-js against fixture documents (`lib/sanity/queries.test.ts`).

Still open from the review, for week 2: alt text is not build-enforced and `school.logo`, `school.heroImage`, `siteSettings.defaultOgImage`, and `article.ogImageOverride` have no alt field; `check:secrets` is not in CI (no workflow yet); OG image URLs are unversioned so a corrected headline can stay cached up to a day at the edge; Editors can still set "Published" by hand.

## Phase 1, week 2: pages (branch phase-1-week-2-pages)

- Home and school fronts: lead, a hairline-divided row of three, Latest with a sticky rail (Join card, Listen and watch), pagination, full-width newsletter band. Top stories never repeat in Latest on any page.
- School sub-nav with curated `navTags`; podcasts, videos, and tags filtered to a school keep the school's header and accent.
- Author (ProfilePage JSON-LD), tag (school chips), podcasts and videos (lead plus grid), search (client index, highlighted matches), newsletter, About, Contact, Terms, Privacy.
- Feeds (`/feed.xml`, `/{school}/feed.xml`), sitemap, robots, search index.
- New content: `infoPage` type, `newsletterSampleUrl` in Settings, a Studio warning for duplicate featured ranks.
- Light-mode `--fg-subtle` darkened to #6F6E6A: the old gray was 3.4:1 and failed for timestamps.
- Mock server now evaluates real GROQ against a 27-article fixture dataset with placeholder art.
- Verified: 52 unit tests, 24 smoke tests (phone and desktop), lint, typecheck, build, secret scan. Article page JS 188KB gzipped.

### Review fixes (week 2 pages)

- Author, tag, podcasts, and videos pages no longer read search params. `?school=` and `?page=` are rewritten to internal routes (`.../f/{school or all}/{page}`, `/authors/{slug}/p/{page}`), so every public page is static or ISR. `all` is now a reserved slug.
- Listen and watch rail no longer repeats a top story.
- Tag and media pages keep heading order (no h1 to h3 jump). Search and newsletter inputs show a visible focus state.
- Duplicate featured-rank warning compares published documents only, so a scheduled version no longer flags itself.
- robots.txt no longer blocks `/search` (its `noindex` must be crawlable). The mock-only asset origin is now `NEXT_PUBLIC_MOCK_ASSET_ORIGIN`.

Still for week 2: Sanity and Circle webhooks, `/api/newsletter`, WordPress redirect map (needs V6), Postmark review email.

## Remaining for week 2 (per AGENTS.md section 12)

- `/api/webhooks/sanity` (revalidation, `status` flip, Circle post), `/api/webhooks/circle`, `/api/newsletter` (the form already posts there and shows an error until it exists).
- WordPress redirect map (needs V6).
- Postmark review notifications.

## Not possible from the repo

- Creating the Sanity project, tokens, CORS origins, and roles. See `docs/setup.md`.
- Creating the Vercel project and env vars.
- Brand fonts and mark (V7). `lib/fonts.ts` and `app/icon.svg` are placeholders.

## Decided

- JS budget (AGENTS.md section 10, v1.2): 200KB gzipped total on the article page, site code under 40KB. Measured 187KB and 35KB on October 19, 2026.

## Open decisions

1. **V9** (Admin API budget vs. the hourly comment-count fallback) is still open in AGENTS.md section 13.
