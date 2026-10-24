# Phase 1 UX and editorial scope update

Status: Final, ready to build. October 24, 2026
Owner: Jon Smith
Baseline: `main` at PR #15, `AGENTS.md` v1.6

This replaces the draft "Phase 1 UX and Editorial Scope Update" with the review decisions applied: the waitlist is stored in Sanity, and the work is split into what ships before the November 9 launch and what follows it.

## 1. Goal

Support a solo author publishing 10 to 12 articles a week, about 60% national college sports and 40% Georgia, with a strong lean toward football and college sports culture (tailgating, traditions, travel, fandom). Add nothing one person cannot maintain.

Reader priorities, in order:
1. Read another story.
2. Subscribe to the newsletter.
3. Join Dawg Social Club, or register interest in a future community.

This is an incremental change. Keep the restrained editorial look, the typography, the performance budgets, and every fixed decision in `AGENTS.md` section 2, except the Plausible goals row, which gains the events in section 11 of this spec.

Do not add a component library, redesign the brand, or add a vendor.

## 2. Release plan

| Release | Ships | Contents |
|---|---|---|
| A. Content model | Before launch | Coverage scope, national routes, optional hero, migration |
| B. Fronts and cards | Before launch | One curated lead, automatic supporting stories, text-only cards |
| C. Header and newsletter | Before launch | Newsletter as the header action, National and Community in nav, newsletter copy |
| D. Article ending | Before launch | Read next, new end-block order, honest community links, simple `/community` page |
| E. Waitlist | After launch | Waitlist form on `/community`, Sanity storage, export script |
| F. Share and topics | After launch | Share control, Football and Culture nav links |

Each release is one PR with its own tests, merged in order. A through D must be merged and verified in production by November 4, leaving launch week for content and QA. If they slip, D is the first to defer.

Before building C, mock the desktop header and the text-only cards on the design canvas for approval.

## 3. Content model (release A)

### 3.1 Coverage scope

New required article field:

```ts
coverageScope: "national" | "school"   // default "school"
```

| Scope | Rules | Canonical URL |
|---|---|---|
| National | `primarySchool` hidden and rejected by validation. `schools` optional: related schools only | `/national/{slug}` |
| School | Current rules: `primarySchool` required and in `schools` | `/{primarySchool}/{slug}` |

- A national article listing Georgia in `schools` appears on the Georgia front, but always links to `/national/{slug}`.
- Slugs stay globally unique.
- The live-article predicate in `lib/sanity/queries.ts` currently requires `defined(primarySchool)`. It becomes: has a slug, and either is national or has a primary school. Every public query uses it.
- Code treats a missing `coverageScope` as `school`. The Studio deploys with the app, so this keeps every page working before the migration runs.

### 3.2 Optional hero

`heroType` gains `none`: `"none" | "image" | "video" | "podcast"`, default `none` for new articles.

- `image` keeps its current requirements (asset, alt, credit).
- `video` and `podcast` keep their embed requirements.
- `none` renders no frame, placeholder, or caption.
- The Studio labels it "No hero (text only)".
- `NewsArticle` structured data and social cards use the generated `/api/og` image when there is no hero.

### 3.3 National routes

- `/national`: front for national-scope articles, same layout and launch-mode rules as a school front, neutral brand accent.
- `/national/{slug}`: article page. A school-scoped slug requested here, or a national slug requested under a school, 301s to its canonical URL.
- `/national?page=N`: the existing static rewrite pattern (`/national/latest/N`).
- `national` added to reserved slugs.

### 3.4 Everything that builds an article URL or reads scope

Update together: the article URL helper and shared types, GROQ projections and TypeGen, home, school, national, author, tag, and media listings, search index, related stories, both feeds (national articles appear in the site feed; school feeds include associated national articles), sitemap, metadata and structured data, OG images (neutral treatment for national), draft preview, webhook revalidation (add `national` and `national-front` tags), and Circle post building.

### 3.5 Circle sync

- School-scoped articles keep the current sync.
- National articles never auto-post, whatever their related schools.
- An article that already has a Circle post and changes scope keeps its post. The handler writes `circleSyncError` ("Scope changed to national; existing Circle post left in place") and makes no further Circle calls for it.
- The Discuss button appears only when `circlePostUrl` exists.

### 3.6 Migration

`scripts/migrate-coverage-scope.mjs`, with `--dry-run` and safe to run twice:

- Sets `coverageScope: "school"` on every article without one, drafts included.
- Sets `heroType: "image"` only where it is missing and a hero image exists. Published hero types are not changed.
- Copies the current rank-one featured story into `siteSettings.homepageLead` if that field is empty, and creates the Site settings document if it does not exist.
- Leaves `featured` and `featuredRank` in place but hidden in the Studio (deprecated, not deleted).
- Does not touch sample content.

Deployment order: merge A (code reads both old and new shapes), run the migration with `--dry-run`, run it for real, verify (no article without `coverageScope`; every existing URL returns 200). Rollback: revert the PR. The added fields are ignored by the old code, so the migration does not need reversing.

## 4. Fronts and story cards (release B)

### 4.1 One curated lead

Site settings gains an Editorial tab with one optional field:

```ts
homepageLead: reference<article>
```

- The home lead is `homepageLead` if it resolves to a live article, otherwise the newest live story.
- School and national fronts use `homepageLead` if it belongs to that front, otherwise their newest story.
- Supporting stories: the three newest in scope, excluding the lead.
- Latest: everything else in scope, newest first, excluding the lead and the three supporting stories.
- Ties on publish time break on `_id`. Initial and paginated views share one selection query, so pages never repeat or skip a story.
- Launch mode is unchanged: under 8 stories in scope, show the lead and one list.

Front-page copy: an editable positioning line in Site settings, default "College sports, on the field and beyond.", set small above the lead. No marketing hero.

### 4.2 Text-only stories

Stories without a hero must look complete, not empty.

- **Lead:** headline and dek set larger, no image rectangle.
- **Supporting card:** label, headline, dek, date. No image block.
- **Story row:** text spans the full width; no empty thumbnail column.
- **Related story:** same treatment as the supporting card.
- The generated gradient fallback (`MediaArt`) is removed for written stories. Podcast and video entries keep their artwork.
- Labels: "National" or the school, plus the content type. A front does not repeat its own section label on every story. Dates as today. Bylines on cards follow the existing single-author rule; article pages always show the author.
- On a 390px phone, an image lead is at most 56% of the viewport height, and the first supporting headline is visible within one scroll.
- Verify with a long headline, a short headline, an image lead, and a text-only lead, in both themes.

The seed script is updated so about half the sample stories are text-only and two are national.

## 5. Header, navigation, and newsletter (release C)

### 5.1 Header

- The filled header button becomes **Newsletter**, linking to `/newsletter`.
- Navigation: **National**, **Georgia** (from `navSchools`), **Podcasts** and **Videos** (existing published-content rules), **Community**, and Search.
- Desktop layout per the approved canvas mock. Default proposal: the wordmark row stays as is, and section links move to a second row beneath it, so the masthead never crowds.
- Phone (390px): wordmark, Newsletter button, menu. The menu lists National and Georgia first, then Community, Podcasts and Videos when live, Search, and the configured menu links. Touch targets at least 44px; keyboard order and focus states preserved.
- One source of truth: section links stay automatic (schools plus National plus live media), and `menuLinks` remains the editable list. No parallel navigation system.
- Kept: the Georgia section header's "Join Dawg Social Club" button and the Join card beside Latest on fronts. Only the header button changes.

### 5.2 Newsletter copy

Editable defaults in Site settings:

- Headline: "College sports, twice a week."
- Blurb: "Sunday's takeaways. Wednesday's look ahead. Original commentary you won't find on the site."
- Fine print: "Free. Unsubscribe anytime."

The same copy appears in the home band, section fronts, article endings, and `/newsletter`. The sample-issue link is passed to every variant and hidden when none is set. The signup endpoint, spam controls, and "signups open soon" behavior are unchanged, and the success message still does not promise a confirmation email until a live signup shows one is sent.

## 6. Article ending (release D)

### 6.1 Order

After the body and any correction:

1. **Read next:** one related story, shown larger.
2. Author card, with the understated "Write for Speakeasy" line.
3. Newsletter signup.
4. Community invitation (6.3).
5. **More to read:** up to two further related stories, excluding Read next.

Empty sections are omitted.

### 6.2 Related stories

Ranking, best first, excluding the current article:
1. Same scope and shared tags (and the same school, for school articles).
2. Shared tags or a shared school association, across scopes.
3. Newest live stories.

### 6.3 Community invitation

| Article | Has a Circle post | Shows |
|---|---|---|
| Georgia (school scope) | Yes | "Discuss in Dawg Social Club" with comment count, links to the thread |
| Georgia (school scope) | No | "Join Dawg Social Club", links to Georgia's `circleJoinUrl` |
| National, or a school without a club | n/a | "Find your community", links to `/community` |

National readers are never sent to Georgia signup by default.

### 6.4 `/community` (pre-launch version)

Heading "Find your college sports community." A short intro, then a Dawg Social Club panel: name, description, "Join Dawg Social Club" (Georgia's `circleJoinUrl`), and a "Member sign in" link from a new optional school field, `circleSignInUrl` (hidden when empty). Below it, one line: "More communities are on the way." Release E adds the waitlist form to this page. Linked from the header and the article ending.

## 7. Waitlist (release E, after launch)

### 7.1 Page

`/community` gains a selector below the Georgia panel:

- A text field with a native suggestion list (`<input list>`), accessible without custom widgets. Choices: National college sports, then the schools in `lib/community-catalog.ts`, then "My school isn't listed" with a free-text school name.
- The catalog is a data file of `{ id, name }` with stable ids (`national`, `alabama`, ...). It starts with the 16 SEC schools other than Georgia and is edited in code. Catalog entries never create a section, route, or sitemap entry.
- Choosing Georgia shows the Georgia panel; no email is asked for.
- Other choices show: email field, the chosen community, an unchecked "Also send me the Sunday and Wednesday newsletter" box, a "Notify me at launch" button, and a line saying this is a waitlist for a community that does not exist yet.
- Success: "You're on the list. We'll email you when this community is ready." A newsletter opt-in is confirmed separately ("You're also subscribed to the newsletter."), or its failure is reported without undoing the waitlist success.

### 7.2 Endpoint and storage

`POST /api/community-interest` with email, community id, optional custom school name, newsletter opt-in, source page, and the honeypot.

Storage is a Sanity document type `communityInterest`, one per email:

- Id `waitlist.{sha256(lowercased email)}`. Ids containing a period are private in Sanity: never returned to anonymous queries, so the public site and CDN can never read them.
- Fields: `email`, `interests[]` (`{ community, customSchool, firstAt, lastAt, source }`), `newsletterOptIn` (`{ at, source }`, set only when opted in).
- A repeat submission adds a new interest or updates `lastAt` on an existing one. Nothing is overwritten or duplicated.
- Written server-side with `SANITY_API_WRITE_TOKEN`. Excluded from every site query, webhook filter, and the sitemap.
- Studio: a "Waitlist" list visible only to Administrators, read-only.
- Newsletter opt-in calls the existing newsletter submission after the waitlist write succeeds.
- Spam: honeypot plus 5 per IP per hour, using the existing KV limiter.
- Without `SANITY_API_WRITE_TOKEN` the endpoint answers 503 and the page says the waitlist is not open yet. It never shows success it did not achieve.

### 7.3 Export and retention

- `pnpm waitlist:export --community alabama` writes a CSV of emails and dates for importing into Circle when that community opens.
- After a community launches and invitations go out, `pnpm waitlist:export --community alabama --delete` removes those interests.
- The privacy page must say waitlist emails are stored to announce the community and deleted after launch. That copy is Jon's, in the Studio.

## 8. Share and topic links (release F, after launch)

### 8.1 Share

A small Share button beside the byline, loaded as its own client component:
- Uses the native share sheet where available, otherwise copies the canonical URL (no tracking parameters).
- Success: "Link copied", announced to screen readers.
- Cancelling the share sheet shows nothing. If both share and copy fail, the URL is shown in a selectable field.

### 8.2 Football and Culture

Two optional tag references in Site settings, Navigation tab: `navTopicFootball`, `navTopicCulture`. Each appears in the navigation, linking to its tag page, only when set and the tag has published articles. No inference from article text.

## 9. Photography

Budget $100 to $300 a month, owned or directly licensed images only. Text-only articles are a normal format, not a fallback. Licenses must cover the website, newsletter, social posts, and Circle previews. No image service, scraping, or agency integration. Documented in `docs/design.md`.

## 10. Out of scope

Brand redesign or new fonts; multiple curated homepage sections; matchup, score, schedule, or standings modules; personalization; accounts or gating; on-site comments; new podcast or video features; newsletter automation; reading time; guide templates; photo purchasing; a search redesign.

## 11. Analytics

Added to the Plausible goals in `AGENTS.md` section 2, each shipped with its feature:

| Event | Release | Fires when |
|---|---|---|
| `read_next_click` | D | Read next story clicked |
| `community_interest_signup` | E | Waitlist write succeeded. Prop `community` (catalog id, or `other`) |
| `share_click` | F | Share completed or link copied. Prop `method`: `native` or `copy` |

Existing events are unchanged. `join_click` locations become `article_end`, `school_header`, `rail`, and `community_page` (the header location is retired). `newsletter_signup` gains location `community_page`. No email addresses, names, or free-text school names are sent to analytics.

## 12. Acceptance

Before launch (A to D):
- A national article publishes and resolves at `/national/{slug}` with no school, and links there from every listing, feed, sitemap, and search result.
- Every existing Georgia URL still returns 200; cross-school redirects still work.
- The home lead follows `homepageLead` and falls back to the newest story when it is cleared, unpublished, or deleted.
- Fronts paginate with no repeats or gaps, compact and full.
- Text-only leads, cards, rows, and articles show no empty media space.
- The header works at 390px and desktop in both themes.
- Read next appears before the newsletter and community asks.
- National articles never auto-post to Circle and never link to Georgia signup.
- Lighthouse 95+ and the JS budget hold on home, Georgia, national, and an article.

After launch (E, F):
- Waitlist submissions store the chosen interest; repeats do not duplicate; the newsletter box is unchecked by default and handled separately; unavailable and partial-success states are accurate.
- Share works with native share, copy, cancel, and the double-failure fallback.

Tests: unit tests for selection, related ranking, URL building, the waitlist upsert, and both endpoints; the existing Playwright smoke suite extended for national routes and text-only cards; integrations mocked. No real contact data or Circle posts in automated tests.

## 13. Deliverables per release

Code and schema, TypeGen output, migration (A), updated `AGENTS.md`, `docs/design.md`, and `docs/setup.md`, test results, desktop and phone screenshots in both themes, and a short list of external setup still needed.

## 14. External setup (Jon)

- Before D: Georgia's `circleJoinUrl` and `circleSignInUrl`, set on the Georgia school in the Studio.
- Before E: a privacy page that covers waitlist storage.
- Ongoing: the existing Circle, Postmark, and Studio page setup from `docs/setup.md`.
