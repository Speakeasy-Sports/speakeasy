# Speakeasy Sports content site: build spec

Status: v1.7, October 24, 2026
Owner: Jon Smith
Purpose: Build spec and working agreement for the Speakeasy Sports content site. Lives at the repo root as `AGENTS.md`. Every contributor treats the Decisions section as fixed and everything else as the plan of record.

---

## 1. Context

Speakeasy Sports is a college sports media company. Its community, the Dawg Social Club (UGA), runs on Circle (Circle Plus plan, community at `club.speakeasysports.com`, branded iOS and Android app launching November 2026). The content site is a public, article-first publication at `speakeasysports.com` with school sections, embedded video and podcasts, and a tight hand-off into the Circle community. More school communities will be added as spaces in the same Circle community and as sections on the same site.

Audience: public readers (search, social, group texts) and members. Conversion path: read, join free, upgrade.

Volume: 10 to 12 articles per week from Jon plus a few contributors. Review and scheduled publishing required.

---

## 2. Decisions (fixed)

| Area | Decision | Notes |
|---|---|---|
| Framework | Next.js, App Router, TypeScript strict, React Server Components by default | pnpm, Node 22 LTS |
| Hosting | Vercel Pro | Cloudflare for DNS only. Do not use Render, Cloudflare Workers, or GoDaddy for this app |
| CMS | Sanity, Growth plan | Roles: Jon = Administrator, trusted editor(s) = Editor, writers = Contributor |
| Styling | Tailwind CSS v4 with design tokens as CSS variables | No component library. Build the small set in section 9 |
| Identity | Phase 1: no site login. Phase 2: site is the OAuth identity provider (Auth.js), Circle custom SSO delegates to it | Circle holds membership tiers and payments. The site reads tier via Admin API |
| Conversation | Lives in Circle. Each article auto-creates a Circle post in the school's space. Site shows a link and comment count | No on-site comments until Phase 3 (Headless API, members only) |
| Branded app | Community only. Articles appear in the app through the auto-posts | Do not push full article text into Circle |
| Domains | `speakeasysports.com` = site. `club.speakeasysports.com` = Circle. Path-based school sections (`/georgia`) | Same top-level domain is required for Circle cookie injection later. Redirect any school domains to their section |
| Newsletter | Circle Email Hub | Flodesk is retired once contacts are migrated |
| Transactional email | Postmark, separate sending domain and message stream for speakeasysports.com | Phase 2 only (magic links) |
| Analytics | Plausible | Goals: `join_click`, `newsletter_signup`, `discuss_click`, `podcast_play`, `video_play` |
| Ads | None. Two direct-sold sponsor slots modeled in the CMS, hidden until sold | Article page below hero, and newsletter |
| Media hosting | None. Embed YouTube, Spotify, Apple Podcasts, and generic podcast RSS players | No self-hosted video or audio in v1 |
| Age policy | 13+ in terms and at Circle signup. No age gate on the site | |
| Writing | American English, no em-dashes in UI copy | Matches house style |

---

## 3. Architecture

```
Readers ──────────────► Vercel (Next.js)
                            │  GROQ over CDN (cached, ISR)
                            ▼
                         Sanity Content Lake  ◄── Sanity Studio (hosted at /studio)
                            │ publish webhook
                            ▼
            Next.js route handler /api/webhooks/sanity
               ├── revalidate affected paths and tags
               └── create or update Circle post (Admin API v2)
                            │
                            ▼
                     Circle (community + app)
                            │ Circle Workflow webhook (comment created)
                            ▼
            Next.js route handler /api/webhooks/circle ──► revalidate comment count
```

Principles:
- Public pages are static or ISR. Zero Circle API calls in the request path for anonymous readers.
- All Circle calls are server-side with the Admin API token. Never ship a Circle token to the client.
- Admin API budget: 30,000 requests per month. Design for under 5,000. Rate limit is 2,000 per 5 minutes per IP.
- Headless Member API (MAU-billed, 500 included) is not used until Phase 3.

---

## 4. Repository layout

```
/app
  /(site)
    /page.tsx                      home (front page)
    /[school]/page.tsx             school section
    /[school]/[slug]/page.tsx      article
    /authors/[slug]/page.tsx
    /tags/[slug]/page.tsx
    /national/page.tsx             national front
    /national/[slug]/page.tsx      national article
    /podcasts/page.tsx             all podcast-type articles
    /videos/page.tsx               all video-type articles
    /search/page.tsx
    /newsletter/page.tsx
    /about/page.tsx, /contact, /terms, /privacy, /write-for-us
  /studio/[[...tool]]/page.tsx     Sanity Studio
  /api
    /webhooks/sanity/route.ts
    /webhooks/circle/route.ts
    /og/route.tsx                  Open Graph image generation
    /newsletter/route.ts           signup handler
    /write-for-us/route.ts         contributor applications, emailed to the editor
    /draft/route.ts                preview mode enable/disable
  /feed.xml/route.ts
  /[school]/feed.xml/route.ts
  /sitemap.xml/route.ts, /robots.ts
/components                        see section 9
/lib
  /sanity   client, queries (GROQ), image builder, schema types
  /circle   admin API client, post builder
  /seo      metadata helpers, structured data
  /analytics plausible helper
/sanity
  /schemas  see section 5
  sanity.config.ts, structure.ts (desk structure)
/styles    tokens.css, globals.css
/scripts   seed, migrate, circle-sync (one-off tools)
```

Conventions: server components unless a component needs state or browser APIs; colocate loaders in `lib/sanity/queries.ts`; one GROQ query per page; typed with Sanity TypeGen; no `any`.

---

## 5. Content model (Sanity)

### school
- `name` (string), `slug`, `shortName` (string, e.g. "Georgia"), `mascot` (string)
- `accentColor` (string, hex), `accentColorDark` (string, hex, optional override)
- `communityName` (string, e.g. "Dawg Social Club")
- `circleSpaceId` (string, the Circle space that receives auto-posts)
- `circleJoinUrl` (url)
- `logo` (image), `heroImage` (image, optional)
- `description` (text), `seoTitle`, `seoDescription`
- `order` (number)
- `navTags` (array of tag refs, up to 6, ordered; the section sub-nav tags, curated by an editor rather than computed)

### author
- `name`, `slug`, `photo` (image with alt), `bio` (text, short), `role` (string, e.g. "Columnist")
- `socialLinks` (array of {platform, url})
- `schools` (array of refs, optional)

### tag
- `name`, `slug`, `description` (optional)

### article
Identity
- `title` (string, max 90), `slug`, `dek` (string, max 200, required)
- `contentType` (enum: `analysis`, `recap`, `preview`, `feature`, `podcast`, `video`, `news`, `opinion`)
- `coverageScope` (enum: `school`, `national`; required, default `school`; a missing value is read as `school`).
- School scope: `schools` (array of refs, min 1). `primarySchool` (ref, required; must be in `schools`). Canonical URL uses `primarySchool`.
- National scope: no `primarySchool` (hidden, and rejected if set). `schools` is optional: related schools only. Listing a school shows the story on that school's front; it never changes the canonical URL and never creates a Circle post.
- `authors` (array of refs, min 1)
- `tags` (array of refs)

Media
- `heroType` (enum: `none`, `image`, `video`, `podcast`; default `none`, labeled "No hero (text only)"). Text-only is a normal format: no frame, placeholder, or caption renders.
- `heroImage` (image with required `alt`, `caption`, `credit`) required when heroType = image
- `heroEmbed` (object: `provider` enum youtube|spotify|apple|other, `url`, `title`) required when heroType = video or podcast
- `episodeSummary` (text, optional, for podcast and video leads)
- `episodeTimestamps` (array of {time, label}, optional)

Body
- `body` (Portable Text). Allowed blocks: paragraph, h2, h3, blockquote, bullet and numbered lists, bold, italic, link.
  Custom blocks: `imageBlock` (image, alt required, caption, credit), `videoEmbed` (youtube url), `podcastEmbed` (provider, url), `socialEmbed` (url, provider x|instagram|tiktok), `pullQuote` (text, attribution), `callout` (title, body, variant info|note), `sponsorSlotRef` (not used in v1 body, reserved).

Workflow
- `status` (enum: `draft`, `review`, `scheduled`, `published`). Only Editors and Admins may set `published`.
- `publishedAt` (datetime), `updatedAt` (datetime, set on any post-publish edit), `correction` (text, optional, rendered at the end of the article)
- `featured` and `featuredRank`: retired, hidden in the Studio, kept on old documents. The homepage lead is `siteSettings.homepageLead`.
- `memberOnly` (boolean, default false; enforced in Phase 2 only)

SEO and social
- `seoTitle`, `seoDescription`, `ogImageOverride` (image, optional), `noIndex` (boolean)

Circle sync (read-only in Studio, written by the webhook handler)
- `circlePostId` (string), `circlePostUrl` (url), `circleCommentCount` (number), `circleSyncedAt` (datetime), `circleSyncError` (string)

### sponsorSlot
- `name`, `placement` (enum: `articleBelowHero`, `newsletter`), `active` (boolean)
- `sponsorName`, `logo` (image), `headline` (string), `url`, `label` (string, default "Presented by")
- `schools` (array of refs, empty = all), `startDate`, `endDate`

### siteSettings (singleton)
Tabs in the Studio: General, Navigation, Newsletter, Copy, SEO.
- Editorial: `homepageLead` (weak reference to one article; empty or unpublished means the newest story leads)
- General: `siteName`, `tagline`, `joinUrl` (default Circle join url), `footerText`
- Navigation: `navSchools` (ordered refs), `menuLinks` (phone menu links after the sections, up to 6), `footerColumns` (up to 2 columns of {title, links}, between Sections and Follow), `legalLinks` (up to 4), `socialLinks`. A link is {label, href}; href is a site path or an https URL. An empty list keeps the built-in default (Search and Newsletter; one Speakeasy column; Terms and Privacy). Header section links (schools, Podcasts, Videos) stay automatic.
- Newsletter: `newsletterHeadline`, `newsletterBlurb`, `newsletterSampleUrl` (url, a past issue)
- Copy: `copy` (buttons, labels, empty states, form messages, 404, footer sign-off). The fields and their defaults live in `lib/site-copy.ts`; an empty field shows the default, which the Studio shows as its placeholder. `{community}` and `{school}` are filled in where a field allows them. Form field labels and screen-reader text stay in code.
- SEO: `defaultOgImage` (share image for any page without its own), `pageSeo` (title and description for home, podcasts, videos, newsletter, search)

### infoPage
- `title`, `slug` (one of `about`, `contact`, `terms`, `privacy`, `write-for-us`), `intro` (text, max 200), `body` (same Portable Text as articles)
- One document per footer page. A missing page 404s rather than showing filler. On `write-for-us` the application form renders under the body.

### Studio configuration
- Desk structure: Articles (by status: Needs review, Scheduled, Published, Drafts), Schools, Authors, Tags, Sponsor slots, Pages, Settings.
- Featured rank: the Studio warns when another published article already holds the same rank. Ties are legal; the more recent story wins.
- Scheduled drafts (Sanity Growth feature) handle timed publishing. Sanity does not set custom fields when it publishes, including scheduled publishes, so the site sets `status` itself: when `/api/webhooks/sanity` receives a published article whose `status` is not `published`, it patches the published document with `status: "published"` and `publishedAt` (if empty, set to now) using the write token. That patch fires the webhook again; the second delivery sees `published` and changes nothing. Nobody sets `published` by hand, and the option is hidden from Contributors.
- Validation: `dek` required, hero alt required, at least one school and one author, `primarySchool` in `schools`.
- Preview: visual editing with `next-sanity` and draft mode. Editors can preview any status.
- Review notification: Sanity webhook on `status` changing to `review` posts to `/api/webhooks/sanity` which sends a Postmark email to the editor (Phase 1 can be a simple email; Phase 2 can post to a private Circle editorial space).

### Roles and the review flow
1. Contributor writes in Studio, sets `status` = `review`. Contributors cannot publish.
2. Editor reviews, edits, sets `publishedAt` (now or scheduled), publishes or schedules.
3. Publish (immediate or scheduled) triggers the Sanity webhook, which sets `status` to `published`, revalidates the site, and creates the Circle post.
4. Any later edit to a published article sets `updatedAt` and republishes. Corrections go in `correction`, never silent.

---

## 6. Routes and page specs

### `/` Home (front page, not a feed)
- Lead story: `siteSettings.homepageLead` when it is live, otherwise the newest story. Large image or hero embed, or a typography-led text-only lead; type label, headline, dek, byline. A short editable positioning line ("College sports, on the field and beyond.") sits above it.
- Supporting: the three newest stories after the lead, in a row of three. No curation.
- "Latest" list: most recent 20 published articles across all schools, with school label, type label, headline, timestamp. Load more via pagination at `/?page=2`.
- Order is newest first with `_id` breaking ties. A picks query names the lead and the supporting three (`lib/fronts.ts`), and the front query excludes exactly those four from Latest on every page, so pages never repeat or skip a story. School and national fronts use the homepage lead only when it belongs on that front; otherwise their newest story leads. No per-section curation.
- Text-only stories render without any picture frame: a larger headline for the lead, a 3px rule in the section color for a card (accent for a school, `--fg` for national), and a full-width row in Latest. Podcast and video entries keep their artwork.
- Launch mode: with fewer than 8 live stories in scope, the front is the lead plus one Latest list (secondary stories fold into Latest, newest first), so a thin front never shows a row of three over one stray row. The full layout returns on its own at 8.
- `/?page=N` and `/{school}?page=N` are rewritten in `next.config.ts` to internal routes (`/latest/N`, `/{school}/latest/N`) so the front pages never read search params and stay fully static. The internal routes set their canonical back to the `?page=N` form. The same applies to `?school=` and `?page=` on `/podcasts`, `/videos`, `/tags/{slug}` (internal `.../f/{school or all}/{page}`) and `?page=` on `/authors/{slug}` (internal `.../p/{page}`).
- Newsletter block between Latest and footer.
- Persistent "Join the Club" in header.
- ISR revalidate 60s, plus tag-based revalidation from the webhook.

### `/[school]` School section
- Same layout as home scoped to the school, using the school accent token.
- Section header: school name, `communityName`, join CTA to `circleJoinUrl`.
- Sub-nav: Latest, Podcasts, Videos, then the school's `navTags` in order (curated in the school document, up to 6). Podcasts and Videos appear once the site has published at least one of each (the page you are on always shows), and a sub-nav that would only say "Latest" is not rendered.
- Reserved slugs (not valid school slugs): `national`, `authors`, `tags`, `podcasts`, `videos`, `search`, `newsletter`, `about`, `contact`, `terms`, `privacy`, `write-for-us`, `studio`, `api`, `feed.xml`, `latest`, `all`, `search-index.json`, `sitemap.xml`, `robots.txt`.
- Podcasts, Videos, and tag links in the sub-nav go to the site-wide pages filtered with `?school={slug}`; those pages render with the school's header, accent, and sub-nav, so the reader stays in the section.

### `/[school]/[slug]` Article
Top to bottom:
1. Type label + school label (accent color)
2. H1, dek
3. Byline: author photo, name (link), `publishedAt` as "2 hours ago" under 24h then "October 19, 2026", `updatedAt` as "Updated ..." when later than publish
4. Hero: image with caption and credit, or embed player for video/podcast leads. For podcast and video leads, `episodeSummary` and timestamps render directly under the player.
5. Sponsor slot `articleBelowHero` if an active slot matches school and date; otherwise nothing (no empty box)
6. Body (Portable Text renderer with the custom blocks)
7. Correction note (if present)
8. End block: "Discuss in {communityName}" button to `circlePostUrl` with `{circleCommentCount} comments`, author card, a one-line "Want to cover {school}? Write for Speakeasy." link to `/write-for-us`, newsletter signup
9. Related: 3 articles, same `primarySchool` and sharing a tag, else same school most recent
- Canonical: `/{primarySchool}/{slug}` for school stories, `/national/{slug}` for national stories. Requests at `/{otherSchool}/{slug}` where the article lists that school 301 to canonical; a national story requested under any school, or a school story requested under `/national`, 301s to its canonical URL. Slugs stay globally unique.
- National stories use the neutral brand treatment, label "National", and show no Discuss or Join button for a school.
- Member-only (Phase 2): body truncated after 2 paragraphs with a join wall; full text for signed-in members with a qualifying tier.
- Structured data: `NewsArticle` with author, publisher, image, dates. `BreadcrumbList`.
- OG image: `/api/og?slug=...` rendering headline, school accent, Speakeasy mark, author. 1200x630. Cached.

### `/national` and `/national/[slug]`
National front: national-scope stories in the school-front layout, no Join card, pagination at `/national?page=N` (rewritten to `/national/latest/N`). National articles share the article page with school articles. School fronts also list national stories associated with the school; those link to `/national/{slug}`.

### `/authors/[slug]`
Photo, name, role, bio, social links, article list (paginated).

### `/tags/[slug]`
Tag name, description, article list, optional school filter.

### `/podcasts` and `/videos`
Grid of articles where `contentType` = podcast or video, newest first, with the embed thumbnail. School filter chips.

### `/search`
Client-side search over a prebuilt JSON index (title, dek, tags, school, author) regenerated on publish. Good enough to 5,000 articles. Replace with Sanity search or Algolia later.

### `/newsletter`
Headline, blurb, email form posting to `/api/newsletter`, sample issue link.

### `/write-for-us`
Info page copy from the Studio, then the application form (section 7.9). Linked from the footer and the article end block.

### Launch-stage switches
Derived from what is published (`lib/site-signals.ts`, one cached query tagged `articles` and `authors`), so nothing needs turning back on by hand:
- Podcasts and Videos links in the header, phone menu, footer, and section sub-nav appear with the first published podcast or video.
- Story cards (lead, cards, rows, related) show the date only while every live article has the same single author; bylines return when a second author publishes. The article page always shows the full byline and author card.

### Feeds and sitemap
- `/feed.xml`: all articles, full text excluded (dek + link), 50 most recent.
- `/[school]/feed.xml`: per school.
- `/sitemap.xml`: route handler (not `app/sitemap.ts`, which stayed at its build-time output on Vercel). Articles, schools, authors, tags. Exclude `noIndex`.

### Redirects
- `www` to apex. `http` to `https`.
- No legacy redirects: the previous site had no content, and the domain is already live on Vercel.
- School domains (if owned) 301 to `/{school}`.

---

## 7. Integrations

### 7.1 Sanity to site (content delivery)
- `next-sanity` client with CDN enabled for published content, `perspective: 'published'`; draft mode uses `perspective: 'previewDrafts'` with a read token.
- Site queries treat any article in the published perspective as live and never filter on `status`, which is a Studio workflow field. Draft mode reads the drafts perspective so editors can preview any status.
- Every query tags its cache by what it knows before fetching: `article-slug:{slug}`, `school:{slug}`, `author:{slug}`, `tag:{slug}`, plus the collections `articles`, `schools`, `sponsors`, `settings`, and `home`. The full vocabulary, and which tags each handler revalidates, is in `lib/sanity/tags.ts`.
- `/api/webhooks/sanity` verifies the Sanity signature, reads the changed document ids and types, calls `revalidateTag` for the affected tags, and returns 200 within 10 seconds. Everything else (Circle sync, email) runs after revalidation.

### 7.2 Site to Circle (auto-post on publish)
- Trigger: Sanity webhook with filter `_type == "article"` on create and update, drafts and versions excluded (the default), so it fires on every publish. Do not filter on `status`: it is still `scheduled` or `review` at the moment of publish and is set by this handler (see section 5, Studio configuration).
- Handler: `lib/circle/syncArticle(articleId)`
  1. Fetch the article (published perspective).
  1a. National stories are skipped. One that already has a post (it changed scope) keeps the post; the handler records `circleSyncError` once and makes no Circle calls.
  2. If `circlePostId` is empty: `POST` a new post in `primarySchool.circleSpaceId` with title = article title, body = dek + "Read the full story: {canonical url}" + hero image. Store `circlePostId`, `circlePostUrl`, `circleSyncedAt` on the article using a Sanity write token (server-side only).
  3. If `circlePostId` exists and the title or dek changed: `PATCH` the Circle post.
  4. On failure, write `circleSyncError` and return; do not retry in a loop. A daily job retries anything with an error.
- Idempotency: lock on `articleId` for 30 seconds (Vercel KV or Upstash) so double webhook delivery doesn't create two posts.
- Budget: roughly 12 creates plus a handful of updates per week, under 100 requests per month.

### 7.3 Circle to site (comment counts)
- Primary: Circle Workflow "comment created" (and "post updated") with a webhook action pointing at `/api/webhooks/circle` carrying the post id. Handler verifies a shared secret in a header, looks up the article by `circlePostId`, fetches the post via Admin API to read the current comment count, writes `circleCommentCount`, revalidates `article-slug:{slug}`.
- Fallback if Workflows cannot send to a webhook: Vercel Cron hourly, fetch counts for articles published in the last 14 days (about 25 posts per hour, under 20,000 requests per month, still inside the 30,000 allowance; drop to every 2 hours if usage climbs).
- The count is informational. If it is stale by an hour, nothing breaks.

### 7.4 Newsletter signup
- The site's own form (home, school, article, `/newsletter`) posts to `/api/newsletter` with email, school slug, and a honeypot field. No Circle script or iframe on site pages.
- The handler submits the address to a Circle Email Hub form through the Admin API (`POST /forms/{form_id}/submissions`, V3), which creates the contact and subscribes it to marketing email. The form is `CIRCLE_NEWSLETTER_FORM_ID`: published, with a profile email field and no other required field. Its layout is read with `GET /forms/{id}` and cached for 10 minutes per instance, so a signup costs one Admin API call.
- Spam: honeypot plus 10 signups per IP per hour (KV). Add Turnstile only if bots get through.
- School interest is sent by the form but not yet stored in Circle; map it to a form dropdown when a second school launches.
- Without the token or form id the endpoint answers 503 and the form says signups open soon. Whether Circle sends a confirmation email is checked with the first live signup; until then the success message promises only the next issue.
- Flodesk migration: export contacts, import to Email Hub as a segment named `flodesk-import-2026-10`, send one re-engagement issue, then cancel Flodesk.

### 7.5 Analytics
- Plausible script in root layout with `data-domain="speakeasysports.com"`. Outbound link tracking on.
- Custom events via `plausible('event', {props})`: `join_click` (location prop: header|article_end|school_header|rail), `newsletter_signup`, `discuss_click`, `video_play`, `podcast_play`.
- No cookie banner needed with Plausible. Add one only if a cookie-setting embed is introduced.

### 7.6 Email
- Postmark message stream `speakeasy-transactional`, sending domain `mail.speakeasysports.com` (DKIM, return-path CNAME).
- Phase 1 use: review notifications and Write for us applications to the editor. Phase 2: magic links.

### 7.7 Phase 2: identity
- Auth.js with email provider (magic link via Postmark). Session in JWT cookie on `speakeasysports.com`.
- The site exposes OAuth 2.0 authorization, token, and userinfo endpoints (Auth.js as provider, or a thin custom implementation) so Circle custom SSO can delegate login. Circle stores `sso_id` = site user id.
- Membership tier: on login, look up the member in Circle by email via Admin API, read paywall or space group membership, cache tier in the session for 15 minutes.
- Gated articles: server component checks `memberOnly` against session tier.
- Headless Auth API: not needed for gating. Only needed when Phase 3 renders Circle content inline.

### 7.8 Phase 3: community on the site
- Headless Member API, signed-in members only, lazy-loaded below the article.
- Inline comment thread rendered from the Circle post, with reply box. Server-side cache of threads for 5 minutes to cut per-visitor reads.
- Circle UI Kit (React, alpha) evaluated first; custom components if it is not stable.
- MAU math reviewed monthly: 500 included, $0.30 each above.

### 7.9 Write for us applications
- Form on `/write-for-us` posts JSON to `/api/write-for-us`: name, email, what they would cover, one or two sample links (http or https), optional social handle, optional "what would make it worth your time", and an 18+ confirmation (contributors must be adults even though readers can be 13+).
- Spam: hidden honeypot field, a 3-second minimum from page load to submit, and 5 submissions per IP per hour (KV counter; allows everything when KV is not set). Honeypot and too-fast submissions get the normal success response.
- Delivery: one Postmark email to `EDITOR_NOTIFY_EMAIL` with Reply-To set to the applicant. Nothing is stored in Sanity or elsewhere. Without Postmark or `EDITOR_NOTIFY_EMAIL` the endpoint answers 503 and the form says applications are not open yet.
- What contributors get (pay, perks) is page copy in the Studio, not code. Adding a form field is a code change.

---

## 8. Design tokens

How these tokens are used (direction, type scale, utilities, and each component as built) is in `docs/design.md`. Change values here and in `styles/tokens.css` together.

`styles/tokens.css`:

```css
:root {
  /* Base palette, Speakeasy Sports */
  --bg: #FCFBF8;            /* warm white */
  --bg-elev: #FFFFFF;
  --fg: #141414;            /* near-black */
  --fg-muted: #5B5B57;
  --fg-subtle: #6F6E6A;      /* 4.9:1 on --bg; #8A8984 was 3.4:1 and failed for timestamps */
  --line: #E6E3DC;
  --brand: #141414;         /* Speakeasy mark; update when assets arrive */

  /* School accent, overridden per section */
  --accent: #141414;
  --accent-fg: #FFFFFF;

  /* Type */
  --font-display: "DisplayFace", Georgia, serif;     /* placeholder until brand type is chosen */
  --font-body: "BodyFace", Georgia, serif;
  --font-ui: system-ui, -apple-system, "Segoe UI", sans-serif;

  --text-body: 1.125rem;    /* 18px mobile */
  --leading-body: 1.6;
  --measure: 42rem;         /* ~680px, 65 to 75 characters */

  --radius: 6px;
  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem; --space-4: 1rem;
  --space-6: 1.5rem; --space-8: 2rem; --space-12: 3rem; --space-16: 4rem;
}
@media (min-width: 768px) { :root { --text-body: 1.25rem; } }   /* 20px desktop */

:root:not([data-theme="light"]) { @media (prefers-color-scheme: dark) {
  --bg: #121210; --bg-elev: #1A1A17; --fg: #F2F0EA; --fg-muted: #B5B3AC;
  --fg-subtle: #8A8984; --line: #2A2A26;
}}
:root[data-theme="dark"] {
  --bg: #121210; --bg-elev: #1A1A17; --fg: #F2F0EA; --fg-muted: #B5B3AC;
  --fg-subtle: #8A8984; --line: #2A2A26;
}

/* Georgia section */
[data-school="georgia"] { --accent: #BA0C2F; --accent-fg: #FFFFFF; }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) [data-school="georgia"] { --accent: #E44A64; --accent-fg: #121210; }
}
:root[data-theme="dark"] [data-school="georgia"] { --accent: #E44A64; --accent-fg: #121210; }
```

Dark-mode school overrides must sit inside the `prefers-color-scheme: dark` query (or under `:root[data-theme="dark"]`). A bare `:root:not([data-theme="light"])` selector matches in light mode too. Georgia dark values: `#E44A64` is 4.9:1 on `--bg` and 4.5:1 on `--bg-elev`; `--accent-fg` flips to near-black because white on that red is only 4.3:1.

Rules:
- Accent is used for labels, links, section headers, and the join button only. Never as a page background.
- Contrast: body text and accent-on-background must pass 4.5:1 in both themes. Each school's `accentColorDark` exists to make that true.
- Fonts self-hosted in `/public/fonts`, loaded with `next/font/local`, `display: swap`. Two families maximum.
- Dark mode follows the system; no toggle in v1.

---

## 9. Components

| Component | Notes |
|---|---|
| `SiteHeader` | Logo, school switcher, join button. Collapses at 390px to logo + join + menu |
| `SchoolNav` | Section sub-nav: Latest, Podcasts, Videos, tags |
| `LeadStory`, `StoryCard`, `StoryRow` | Front page units. Image sizes fixed via `next/image` with `sizes` set |
| `TypeLabel`, `SchoolLabel` | Small caps labels in accent |
| `Byline` | Author photo, name link, timestamp with `<time datetime>` |
| `HeroImage` | `next/image`, priority on article pages, caption and credit |
| `MediaFrame` | Fixed aspect-ratio container (16:9 video, 152px podcast) that prevents layout shift |
| `YouTubeEmbed` | Facade: thumbnail + play button, loads iframe on click. Fires `video_play` |
| `PodcastEmbed` | Spotify or Apple iframe inside `MediaFrame`, lazy below fold. Fires `podcast_play` |
| `SocialEmbed` | X, Instagram, TikTok via official embed scripts, lazy, with fallback link |
| `PortableTextRenderer` | Maps blocks in section 5 to components |
| `PullQuote`, `Callout` | |
| `SponsorSlot` | Renders only when an active slot matches; "Presented by" label, logo, headline, link |
| `DiscussInClub` | Button to Circle post with comment count; falls back to the school join url if no post yet. Fires `discuss_click` |
| `AuthorCard` | End-of-article |
| `NewsletterSignup` | Inline and page variants. Fires `newsletter_signup` |
| `WriteForUsForm` | Contributor application on `/write-for-us` (section 7.9) |
| `RelatedStories` | |
| `CorrectionNote` | |
| `JoinWall` | Phase 2 |
| `Footer` | Nav, social, legal, "Built for fans" line |

---

## 10. Performance and quality budgets

- LCP under 2.5s on a mid-tier phone over 4G for the article page. CLS 0. INP under 200ms.
- Article page JS under 200KB gzipped before any embed is activated, of which site code (everything outside the React and Next.js runtime) stays under 40KB. Measured October 19, 2026: 187KB total, about 150KB runtime, about 35KB site code. Draft-mode tooling must never ship to readers; it loads as an async chunk only when draft mode is on.
- Images: `next/image`, AVIF/WebP, hero sized to 1200px max, cards to 600px. Every image has alt text (enforced in Sanity).
- Fonts: 2 families, subsetted, under 120KB total.
- Lighthouse 95+ on Performance, Accessibility, Best Practices, SEO for home, school, and article.
- No autoplay, no modals, no sticky video.
- Tests: Playwright smoke for home, school, article, feed, sitemap, and the webhook handlers with mocked Circle. Vitest for `lib/circle` and `lib/seo`.

---

## 11. Environment variables

```
NEXT_PUBLIC_SITE_URL=https://speakeasysports.com
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=            # draft mode
SANITY_API_WRITE_TOKEN=           # circle sync writes, server only
SANITY_WEBHOOK_SECRET=
SANITY_REVALIDATE_SECRET=
CIRCLE_ADMIN_API_TOKEN=           # server only
CIRCLE_ADMIN_API_BASE=            # optional, defaults to https://app.circle.so/api/admin/v2
CIRCLE_SYNC_ENABLED=false         # true after one test post looks right
CIRCLE_COMMUNITY_ID=
CIRCLE_WEBHOOK_SECRET=            # shared secret for /api/webhooks/circle
CIRCLE_NEWSLETTER_FORM_ID=        # Email Hub form that /api/newsletter submits to (7.4)
CIRCLE_BASE_URL=https://club.speakeasysports.com
POSTMARK_SERVER_TOKEN=
POSTMARK_FROM=hello@mail.speakeasysports.com
EDITOR_NOTIFY_EMAIL=
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=speakeasysports.com
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
KV_REST_API_URL=                  # idempotency locks (Upstash Redis via the Vercel integration)
KV_REST_API_TOKEN=
CRON_SECRET=                      # Vercel Cron auth for /api/cron/circle-daily
# Phase 2
AUTH_SECRET=
AUTH_URL=https://speakeasysports.com
```

---

## 12. Phase plan

### Phase 1: public site. October 20 to November 9, 2026

Week 1, October 20 to 26
- Repo, Next.js, Tailwind, tokens, fonts (placeholder until brand assets arrive)
- Sanity project on Growth, schemas, desk structure, validation, Studio at `/studio`
- Article page complete including all embed types, OG image route, structured data
- Vercel project, preview deploys, env vars

Week 2, October 27 to November 2
- Home, school section, author, tag, podcasts, videos, search, newsletter pages
- Feeds, sitemap
- Sanity webhook: revalidation plus Circle auto-post, with tests
- Circle Workflow for comment counts (or hourly cron fallback)
- Plausible, Postmark review notifications

Week 3, November 3 to 9
- Load 15 to 20 articles with contributors so the front page is real on day one
- QA pass on phone, Lighthouse, accessibility checks, dark mode
- Flodesk export and Email Hub import, first newsletter from Email Hub
- Launch Monday, November 9. The domain is already live on Vercel, so there is no DNS cutover.

Acceptance: a contributor can draft, an editor can schedule, the article appears on the site and as a Circle post within one minute of publish, and the article page scores 95+ on Lighthouse mobile.

### Phase 2: identity and gated content. December 1 to 19, 2026
- Auth.js magic-link login, OAuth provider endpoints, Circle custom SSO pointed at the site
- Member tier lookup, `memberOnly` gating, `JoinWall`, member state in header
- Email Hub signup via API if available
Acceptance: one login works on the site, the web community, and the branded app. Gated article shows the wall to guests and full text to members.

### Phase 3: community on the site. January 12 to February 27, 2027
- Headless Member API inline comments for signed-in members
- Second school section and Circle space
- First direct-sold sponsor slot live
Acceptance: inline thread matches the Circle post, MAU usage visible in a monthly report, second school live with its own accent and feed.

---

## 13. Verify before building

| # | Item | Why it matters | Owner |
|---|---|---|---|
| V1 | Custom SSO is enabled on the Circle Plus plan | Phase 2 design depends on it | Jon, CSM |
| V2 | Branded app honors custom SSO | One-login promise | Jon, CSM |
| V3 | Admin API can create Email Hub contacts | Newsletter signup integration vs. embed fallback | Done October 21, 2026: yes, via form submissions. See `docs/circle-api-notes.md` |
| V4 | Admin API v2 base URL, create-post body format (TipTap JSON vs. plain), image attachment on posts | Section 7.2 | Done October 19, 2026: TipTap JSON, cover via direct upload. See `docs/circle-api-notes.md` |
| V5 | Circle Workflows can call an external webhook on "comment created" | Section 7.3 primary vs. fallback | Engineering, Circle admin. Docs confirm webhook actions exist; the "comment created" trigger still needs checking in the admin |
| V6 | Current WordPress URLs worth redirecting | Section 6 redirects | Done October 20, 2026: No legacy content; no redirects needed |
| V7 | Brand assets and type choices | Tokens and fonts | Jon |
| V8 | Photo rights plan for hero images | Content ops, not code | Jon |
| V9 | Admin API budget target vs. comment-count fallback. Section 3 says design for under 5,000 requests per month; the hourly cron fallback in 7.3 uses about 18,000. Decide: raise the target, or run the fallback every 4 hours (about 4,500) | Only matters if V5 fails and the cron fallback is used | Jon |

---

## 14. Working agreements

- Read this file and `sanity/schemas` before any change. Do not rename schema fields without a migration script in `/scripts`.
- Server components by default. Client components only for embeds, search, forms, and the school switcher.
- No Circle token or Sanity write token in client bundles. Grep for them in CI.
- Every page sets metadata (title, description, canonical, OG) through `lib/seo`.
- Every image needs alt text. Fail the build on missing alt in Portable Text blocks.
- Keep the Admin API call count visible: log each call with a route label; add a weekly summary to the Vercel cron.
- Commit style: `feat:`, `fix:`, `chore:`, `content:`. One PR per feature. Preview deploy link in every PR.
- Branch names describe the work (`phase-1-week-1`, `fix-og-cache`). Rename any auto-generated branch name before the first push.
- Copy in UI uses American English, no em-dashes, no emojis.
- When unsure about a Circle endpoint, open the Swagger spec rather than guessing, and record what was found in `/docs/circle-api-notes.md`.
- No tool or vendor attribution in commits, PR descriptions, code comments, or docs.


<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
