Design review

# Speakeasy Sports design sweep

What keeps the site from feeling world-class for sports media two weeks before launch, and the specific fixes, ranked.

October 25, 2026 · main at 3d1cfbe · live site plus local mock build · 23 findings · nothing in the repository was changed

> **Status in the repo.** Before-launch code fixes F2, F3, F4, F5, F7, F8 (accent backup and layout), F9, F10 with decision 6, F11, F16, F18, and F22 shipped in the "design sweep launch fixes" pull request. Georgia's accent colors were set in the Studio on October 25. F1's remaining Studio content is with Jon. The after-launch list in section 4 is the plan of record. The screenshots named below were captured in the review session and are not stored in the repository.

Findings

1. [Production content and settings are not populated](#f1)
2. [The email input collapses to 22px on phones](#f2)
3. [Text-only articles have no gap between byline and body](#f3)
4. [The secondary row breaks at tablet and misaligns at desktop](#f4)
5. [The rail sinks below twenty stories on tablets](#f5)
6. [The Latest river is a third too tall for a sports front](#f6)
7. [Body links are nearly invisible outside a school section](#f7)
8. [The share image drops the school identity](#f8)
9. [Dark-mode Georgia buttons fail contrast on hover](#f9)
10. [Touch targets under 44px](#f10)
11. [Byline indents when no author photo exists](#f11)
12. [Headline scale and fit drift across the site](#f12)
13. [The school front shows no school beyond its name](#f13)
14. [Page rhythm uses six different section gaps](#f14)
15. [The article ending runs long and the club button floats](#f15)
16. [The national front leaves a third of the page empty](#f16)
17. [Desktop section links are small for a primary nav](#f17)
18. [Story units do not react as one on hover](#f18)
19. [Form error and success states are browser defaults or absent](#f19)
20. [The 404 and empty search pages stop the reader](#f20)
21. [Fine print and meta are at the contrast floor on elevated surfaces](#f21)
22. [Numerals: headlines are proportional, body is tabular, which is the right way round](#f22)
23. [Brand voice reads as a general serif publication](#f23)

# Speakeasy Sports design sweep

Reviewed October 25, 2026, against `main` at commit 3d1cfbe (editable copy and search titles). Live site at speakeasysports.com plus a local build against the mock dataset (29 stories, podcasts, videos, two schools). Screenshots are in `shots/live`, `shots/local`, and `shots/states` beside this file; names follow `page-width-theme.png`, with `-fold` for the first screen.

Two notes on the evidence. The sandbox blocks `cdn.sanity.io`, so every photo on the live screenshots is an empty frame; the local screenshots (placeholder art) show the photo states. And `system-ui` resolves to Inter here, so labels, meta, and buttons will look slightly different on iPhone (SF) and Android (Roboto); sizes and spacing are unaffected.

Nothing in the repository was changed. Every recommendation names the file and describes the change for the owner to approve.

## 1. Verdict

The bones are right: a real editorial type system, a disciplined token set, honest text-only stories, and a fast, static page. It currently reads as a well-made literary serif site rather than a sports publication, and the production content has not caught up with the code, so a reader landing on November 9 would find an empty Community page and a 404 behind every footer link. Schools stay out of the navigation by the owner's choice, which makes the remaining doors into the Georgia section (the red school label on every story, the footer) carry more weight. The three changes that matter most before launch are: populate Site settings and the five page documents in the Studio (one hour, no code); fix the collapsed email input, which is 22px tall on every form below 640px; and put 32 to 40px of air between the byline and the first paragraph on text-only articles, which will be most of the launch inventory. After those, the biggest lift toward "sports media" is density and identity: a tighter Latest river, the school mark in the section header and share image, and the secondary row aligned so photo and text-only stories sit as one row.

## 2. Findings, ranked by impact

### F1 Production content and settings are not populated

- **Severity:** Launch blocker (content, not code)
- **Where:** live site, every page. Controlled by Site settings and page documents in the Studio; the code paths are `components/SiteHeader.tsx:19` (`navSchools`), `components/Footer.tsx:42`, `app/(site)/community/page.tsx:46`, `app/(site)/_views/ArticleView.tsx:197` (`openClub`), `app/(site)/_views/InfoPageView.tsx`.
- **Evidence:** `shots/live/home-1280-light.png` (header row reads "National · Community"; footer Sections lists National and Search; both are by choice, since `navSchools` is left empty on purpose), `shots/states/menu-open-390.png` (phone menu: National, Community, Search, Write for us), `shots/live/community-1280-light.png` (heading, two hairlines, no club panel), `shots/live/article-national-1280-light.png` (no community invitation at the end). `/about`, `/contact`, `/terms`, `/privacy`, and `/write-for-us` all return 404. The author page shows a gray circle, "Test bio", and an "X" chip with no URL. The Georgia school description is the two words "Georgia Bulldogs".
- **Why it matters:** a sports reader arrives from a group text or search, reads one story, and looks for the team. With schools out of the navigation by choice, the only paths into `/georgia` are the red school label on each story and the Join card, so those must work on day one. Every conversion path on the article end (Join, Find your community, Write for Speakeasy) currently leads nowhere or does not render.
- **Recommendation:** in the Studio, before anything else (leave `navSchools` empty, as decided): set Georgia's `circleJoinUrl` (and `circleSignInUrl`, `description`, `logo`, `accentColor` #BA0C2F, `accentColorDark` #E44A64); create the five `infoPage` documents, even short ones; set Jon's author photo, bio, role, and social URLs; set `tagline` (the footer shows nothing without it); set `newsletterSampleUrl` once one issue exists. The migration and seed scripts already know these fields. Because the header will not list Georgia, keep `SchoolLabel` red and linked everywhere (it is), and leave the footer without schools as well (decision 7), so the story label and the Join card are the section's two doors.
- **Cost:** S, zero code. No performance effect.
- **Benchmark:** The Athletic's team pages exist before the first story does; the nav is the promise, the stories fill it in.

### F2 The email input collapses to 22px on phones

- **Severity:** Launch blocker
- **Where:** every newsletter form (home and school bands, article end, `/newsletter`, `/community` closing link) below 640px, both themes. `components/NewsletterSignup.tsx:82`.
- **Evidence:** `shots/states/newsletter-input-390.png`. Measured: input 358x22 at 390px and 576x22 at 639px; 465x48 from 640px. The button beside it is 48px tall. Cause: `flex-1` (flex: 1 1 0%) inside the `flex-col` form gives the input a zero flex basis in the column direction, so `h-12` is overridden and the field shrinks to its line height.
- **Why it matters:** the newsletter is reader priority two in the UX spec and the one filled button in the header. On the phone, where most sports traffic is, the field looks broken and is below the 44px touch target.
- **Recommendation:** change `flex-1` to `sm:flex-1` (or add `basis-auto`) so the input keeps `h-12` in the column layout and only flexes in the row. One class. Check `components/WriteForUsForm.tsx` inputs, which use a plain grid and are not affected.
- **Cost:** S. None.
- **Benchmark:** Defector's signup field is the same height as its button at every width; the pair reads as one control.

### F3 Text-only articles have no gap between byline and body

- **Severity:** High
- **Where:** any article with `heroType: none`, all widths, both themes. `app/(site)/_views/ArticleView.tsx:123-161`: the `header` has no bottom margin and `.article-body` has no top margin; the 32px of air on photo stories comes from `HeroImage`'s `my-8`.
- **Evidence:** `shots/live/article-text-390-light.png` and `shots/live/article-national-1280-light.png`: "October 22, 2026" sits directly on "Every fan base wants a pretty offense." Measured gap 0px on live; on a photo story the body starts 711px below the header because the figure carries the spacing.
- **Why it matters:** text-only is the normal format at launch (the seed is half text-only, the two national stories both are). The first thing a reader sees after the headline is a formatting slip, on the page that carries the most traffic.
- **Recommendation:** give the header the spacing and let media add only its own bottom margin. In `ArticleView.tsx`, add `mb-8 md:mb-10` to the `header` (32px, 40px: `--space-8` and 2.5rem), and change `HeroImage` (`components/HeroImage.tsx:9`) and the two embed wrappers (`ArticleView.tsx:140, 149`) from `my-8` to `mb-8`. Net effect on photo stories: unchanged.
- **Cost:** S. None.
- **Benchmark:** The Ringer's text-only columns open with a clear band of space under the byline; the first paragraph is visibly the start of something.

### F4 The secondary row breaks at tablet and misaligns at desktop

- **Severity:** High
- **Where:** home and school fronts with 8 or more stories. 768 to 1023px in `components/FrontPage.tsx:77` (`sm:grid-cols-2`); 1024px and up in the same grid with a text-only card from `components/StoryCard.tsx:44`.
- **Evidence:** `shots/local/home-full-768-light.png`: two photo cards on one row, the third story (a podcast) alone on a second row at full width, so the "row of three" never exists between 640 and 1023px. `shots/live/home-1280-light.png` and `shots/states/focus-section-1280.png`: the text-only card's rule and headline sit at the photo cards' image top, so the row has two headlines at y=436 and one at y=246; the eye reads it as a layout error rather than a deliberate text item.
- **Why it matters:** this row is the second thing the front page says. On an iPad in landscape, the most common tablet reading posture for Saturday football, it currently says "two stories and a leftover".
- **Recommendation:** (a) make the row three-up from 640px: `sm:grid-cols-3 sm:gap-x-6 lg:gap-x-16`, dropping the two-column stage; card headlines are 22px, which three 220px columns carry comfortably. (b) Let the text-only card earn its place with type rather than position: in `StoryCard.tsx:47` set the text-only headline to `text-[1.5rem] lg:text-[1.75rem] leading-[1.1]` (24/28px) and the dek to `text-[1.0625rem]` (17px). It then reads as the row's "lead" item, which is what a 3px rule promises. If the owner prefers a common headline line instead, the alternative is `h-full justify-end` on the text-only card so its headline sits beside the others, with the rule staying at the top.
- **Cost:** S. None.
- **Benchmark:** The New York Times front mixes photo and text-only items in one row by giving the text-only item a larger headline and a summary, never an empty box, and never a lower headline.

### F5 The rail sinks below twenty stories on tablets

- **Severity:** Medium
- **Where:** home and school fronts, 768 to 1023px. `components/FrontPage.tsx:89` (`lg:grid-cols-12`) and `:108` (the aside becomes sticky only at `lg`).
- **Evidence:** `shots/local/home-full-768-light.png`: the Join card and "Listen and watch" appear after the pagination controls, roughly 5,600px down a 7,175px page.
- **Why it matters:** the Join card is the only club promotion on the front. At tablet widths it is effectively hidden, and the Latest river runs the full 720px measure, which is too wide for 23px headlines (lines reach 90 characters).
- **Recommendation:** start the two-column layout at `md`: `md:grid-cols-12 md:gap-10` on the wrapper, `md:col-span-8` on Latest and `md:col-span-4` on the aside (not sticky until `lg`). The river column becomes about 470px at 768, which is the right measure for the row headline.
- **Cost:** S. None.
- **Benchmark:** ESPN's team pages keep the "Follow" and community modules in view at tablet width rather than appending them.

### F6 The Latest river is a third too tall for a sports front

- **Severity:** Medium
- **Where:** home, school, and national fronts and archive pages at 1024px and up. `components/StoryRow.tsx:21-33`.
- **Evidence:** `shots/local/home-full-1280-light.png`: 20 rows average 135px each (label 19px, headline 2 lines at 23px, dek 1 to 2 lines at 16px, meta 13px, 24px padding top and bottom). The page is 5,704px tall at 1280. On the phone the dek is already hidden on picture rows and the river reads well at about 95px a row.
- **Why it matters:** sports readers scan rivers for a team, a type, and a headline; decks slow the scan and make every row look the same weight. The best sports rivers are deliberately denser than the article page.
- **Recommendation:** hide the dek on picture rows at every width (`StoryRow.tsx:33`: drop `sm:block`, keep deks on text-only rows where they carry the item), reduce row padding from `py-6` to `py-5` (20px, `--space-4` plus 4), and set the desktop row headline to `sm:text-[1.375rem]` (22px). Expected row height about 100px, river about 30 percent shorter, no loss of information the reader was using.
- **Cost:** S. None.
- **Benchmark:** The Athletic's "Latest" list is headline, kicker, and time only; the dek belongs to the article.

### F7 Body links are nearly invisible outside a school section

- **Severity:** Medium
- **Where:** national articles and any page where `--accent` equals `--fg`, both themes. `styles/globals.css:212-218`.
- **Evidence:** link color is `var(--accent)`, which is #141414 on `/national` (identical to body text), and the underline is the accent at 40 percent: about 2.9:1 against the paper in light mode and 1.7:1 in dark. In `shots/live/article-national-1280-light.png` the only link in the body is indistinguishable from the sentence around it. Inside Georgia stories the red link at 6.4:1 is fine (`shots/local/article-image-local-1280-light.png`, "box score").
- **Why it matters:** national stories are 60 percent of the planned output. Links to box scores, schedules, and sources are part of the service.
- **Recommendation:** keep the 40 percent underline for school accents, where the color does the work, and use a full-strength underline where the accent is neutral: in `globals.css` set `.article-body a { text-decoration-color: var(--accent); text-decoration-thickness: 1px; }` and add `[data-school] .article-body a { text-decoration-color: color-mix(in srgb, var(--accent) 40%, transparent); }`. No new color, so the one-accent rule holds.
- **Cost:** S. None.
- **Benchmark:** The Ringer underlines body links at full strength in its neutral sections and lets color carry them only where there is color.

### F8 The share image drops the school identity

- **Severity:** Medium
- **Where:** `/api/og?slug=...` for every Georgia story. `app/api/og/route.tsx:34` reads `school.accentColor` from the CMS, but Georgia's red lives only in `styles/tokens.css:68`, so the card falls back to #141414.
- **Evidence:** `shots/states/og-saturday-in-athens.png`: black kicker bar and "FEATURE / GEORGIA" in black, a "J" monogram in a black circle, and about 200px of empty canvas between kicker and headline. `og-welcome-to-speakeasy-sports.png` (national) looks the same, so school and national cards are indistinguishable in a feed.
- **Why it matters:** most launch traffic will arrive from X, group texts, and the Circle posts, where the card is the headline. The one place the site could show red says nothing.
- **Recommendation:** set Georgia's `accentColor` in the Studio (content fix, covered in F1), and as a belt-and-braces change add a code fallback: a `BUILTIN_ACCENTS` map in `lib/color.ts` keyed by slug, used by the OG route and `SchoolTheme`. In the same route, use the vertical space: headline 72px when under 70 characters (60px otherwise), add the dek at 28px in `--fg-muted` on one line (truncate at 90 characters), and draw the kicker bar 8px wide instead of 14. After launch: render the author photo from Sanity when one exists, and place the hero photo as a right-hand 480px panel when `heroType` is `image`.
- **Cost:** S for the fallback and layout, M for photos. The route is cached for a day at the edge; no reader-side cost.
- **Benchmark:** The Athletic's share cards carry the team color as a thin bar and the headline large; you know whose story it is at thumbnail size.

### F9 Dark-mode Georgia buttons fail contrast on hover

- **Severity:** Medium
- **Where:** Join and Discuss buttons in dark mode inside Georgia pages. `components/JoinButton.tsx:17`, `components/DiscussInClub.tsx:32`, `components/SiteHeader.tsx:46`, `components/NewsletterSignup.tsx:90` (all `hover:opacity-90`).
- **Evidence:** measured. Georgia dark: #121210 on #E44A64 is 4.88:1 at rest; at 90 percent opacity over the page the button becomes about #CF445C and the ratio drops to 4.14:1. Light Georgia drops from 6.6:1 to 5.8:1 (passes). Related edges: Georgia dark on `--bg-elev` is 4.54:1, the floor, so the Join card and community panel are at the limit already.
- **Why it matters:** the hover state is the state the finger or cursor is in when the decision is made.
- **Recommendation:** replace `hover:opacity-90` on the four filled buttons with a mix toward ink, which darkens in light mode and lightens in dark mode: `hover:bg-[color-mix(in_srgb,var(--accent)_90%,var(--fg))]` (for `bg-fg` buttons, mix with `var(--bg)`). Georgia dark hover becomes about #E65B72, 5.1:1 against the text; light hover becomes about #A90D2C, 7.2:1.
- **Cost:** S. None.
- **Benchmark:** Defector's buttons shift value on hover rather than fading, so the label never loses contrast.

### F10 Touch targets under 44px

- **Severity:** Medium
- **Where:** phones. Footer links (`components/Footer.tsx:22-30`): 19px tall with 10px gaps, effective 29px. Author card social links (`components/AuthorCard.tsx:40-43`): "X" measures 10x17. Filter chips and author-page chips (`components/FilterChips.tsx:16`, `app/(site)/_views/AuthorView.tsx:93`): 36px. Inline links at the article end ("Write for Speakeasy", "Read a sample issue", "Find your community"): 16 to 21px, acceptable as inline text under WCAG 2.5.8 but tight on a phone. Measured on `shots/live/home-390-light.png` and `article-podcast-390-light.png`.
- **Why it matters:** the footer is where a phone reader goes for About, Contact, and RSS; the author links are where a reader follows the writer. Both are worth a thumb.
- **Recommendation:** Footer `Item`: `inline-flex min-h-11 items-center sm:min-h-0` and reduce the list gap to `gap-1 sm:gap-2.5` so the column does not grow. AuthorCard socials: reuse the author-page pills (`h-11 sm:h-9`). FilterChips and author-page chips: `h-11 sm:h-9`. Menu, sub-nav, pagination, header buttons already measure 44 to 48px.
- **Cost:** S. None.
- **Benchmark:** ESPN's phone footer links are full-width rows; nothing in it requires precision.

### F11 Byline indents when no author photo exists

- **Severity:** Medium
- **Where:** article pages, all widths. `components/Byline.tsx:25-27`.
- **Evidence:** `shots/live/article-national-1280-light.png` and `article-text-390-light.png`: "Jon Smith" and the date start 12px right of the dek because the empty avatar container still renders with the 12px gap. A new contributor without a photo, or Jon before his photo is uploaded, gets the same slip on every story.
- **Why it matters:** bylines are trust signals in sports media; a misaligned one looks like an afterthought.
- **Recommendation:** render the avatar container only when at least one listed author has a photo. Better: show a monogram fallback (a 40px circle in `--accent` with the first initial in `--accent-fg`, as the OG route already does) so every byline has a face-shaped anchor. The same fallback belongs in `StoryMeta` with `withPhoto` and in `AuthorCard`.
- **Cost:** S. None.
- **Benchmark:** The Athletic shows a writer avatar on every byline, and a neutral monogram when the photo is missing.

### F12 Headline scale and fit drift across the site

- **Severity:** Medium
- **Where:** every headline. `styles/globals.css:81` (`headline` utility: leading 1.12, tracking -0.018em) is overridden per component with eleven different pairs; the full inventory is in section 3.
- **Evidence:** measured at 1280 and 390. Lead 46/48.8px (1.06); text-only lead 56px (1.04); article H1 48/51.8 (1.08); card 22/26.4 (1.2); text-only card 24 (1.15); row 23 (1.2); read next 26 (1.1); join card 26 (1.1); school title 88px at 0.95 and -0.035em; page header 64px at 0.98 and -0.03em; wordmark 26px at -0.02em. Lead at `lg:items-center` (`components/LeadStory.tsx:33`) floats the headline block mid-photo rather than hanging it from the photo's top edge.
- **Why it matters:** none of these is wrong in isolation, but the ratios do not step. Card and row headlines are nearly identical sizes with different leading; the text-only card is a half step above both; the lead and the article H1 are within 2px of each other with different leading. A consistent scale is what makes a front page feel edited.
- **Recommendation:** adopt the scale in section 3: three display sizes above 40px share leading 1.0 to 1.02 and tracking -0.03em; headlines 32 to 40px share leading 1.05 and -0.022em; 19 to 28px share 1.15 to 1.18 and -0.018em. Concretely: card and row both to 20/22px at 1.18; text-only card to 24/28px; lead image headline to leading 1.04; H1 to leading 1.06; `lg:items-start` on the image lead with `pt-1` on the text column so the kicker aligns with the photo's top edge.
- **Cost:** S. None (no new font weight; everything stays on the one Fraunces cut).
- **Benchmark:** The Ringer's front uses four headline sizes, each a visible step from the next, and never two that are a pixel apart.

### F13 The school front shows no school beyond its name

- **Severity:** Medium
- **Where:** `/georgia` header, `components/SchoolHeader.tsx:28-47`; the rail, `components/JoinCard.tsx`; the OG card. The `school.logo` field exists in the schema (`sanity/schemas/school.ts:75`) and is rendered nowhere.
- **Evidence:** `shots/live/georgia-1280-light.png`: "Dawg Social Club" kicker, 88px "Georgia", a two-word description on the right, a red rule. `shots/local/georgia-full-390-light-fold.png` is better (a real description) but still typographic only.
- **Why it matters:** team identity is what sports readers come for. The red kicker and rule are the right restraint, but a mark at the top of the section is the difference between a section and a tag page.
- **Recommendation:** render the school mark (the CMS `logo`, 48px tall, left of the kicker; 32px in the Join card; 56px in the share image) when present. A mark is ink, not paint, so the section 8 rule holds. Move the description under the title, left-aligned, `max-w-2xl`, 17px `font-ui`; the right column keeps only the Join button, bottom-aligned with the title's baseline. The description's right alignment currently reads as a detached caption.
- **Cost:** S to M (one `SanityImage` in three places; needs a logo asset from Jon and alt text). One small image request on the section front, lazy below the lead on phones is not needed as it sits in the first screen; use `priority` only on the front.
- **Benchmark:** Defector's team-ish sections use a single mark and one color; no banners, no backgrounds.

### F14 Page rhythm uses six different section gaps

- **Severity:** Medium
- **Where:** fronts and article ends. `components/FrontPage.tsx:77` (lead to row: 40px plus 32px padding at `lg`, 56 plus 32 on phones), `:89` (row to Latest: 56/80), `app/(site)/_views/HomeView.tsx:48` and `SchoolView.tsx:81` (Latest to newsletter band: 96), `components/Footer.tsx:40` (band to footer: 96 unless the band is last), `ArticleView.tsx:167-168` (body to Read next 56, Read next to end block 48, each end section 32 plus 32), `components/RelatedStories.tsx:10` (64), `components/ReadNext.tsx:16` (56).
- **Evidence:** the measured front at 1280: section header to lead 48px, lead to row 88px, row to Latest 80px, Latest to band 96px, band to footer 0. The article end: 56, 48, 64, 64, 64, 64. The direction says "rhythm between front sections 56 on phones, 80 at lg", and only one gap matches.
- **Why it matters:** rhythm is what makes a sparse front look intentional. When gaps are all slightly different, a thin page reads as unfinished rather than calm.
- **Recommendation:** a four-step page scale mapped to tokens, in section 3: 24 (`--space-6`) inside a unit, 32 (`--space-8`) between units, 48/64 (`--space-12`/`--space-16`) between front sections on phone/desktop, 64 (`--space-16`) before bands and the footer on both. Apply: lead to row `mt-12 lg:mt-16 pt-8` to `mt-8 pt-8 lg:mt-12`; row to Latest `mt-12 lg:mt-16`; band `mt-16`; article end sections `py-6`; Read next and Related `mt-12`.
- **Cost:** S. None.
- **Benchmark:** The New York Times front holds one vertical gap between packages across the whole page; density changes, the gap does not.

### F15 The article ending runs long and the club button floats

- **Severity:** Medium
- **Where:** article pages, especially phones. `app/(site)/_views/ArticleView.tsx:167-210`, `components/DiscussInClub.tsx`, `components/RelatedStories.tsx`.
- **Evidence:** `shots/local/article-video-390-light.png`: after the body, Read next (300px), author card and write prompt (170px), newsletter (330px), a lone "Join Dawg Social Club" button in its own hairline section (100px), then More to read as two stacked photo cards (about 800px). About 1,700px of ending on a 4,300px page. The club button is the only element on the page with no sentence attached.
- **Why it matters:** the UX spec sets this order deliberately and it should stay. But the community ask is the venture's business model and it currently reads as a leftover control, while two full photo cards below it compete with everything above.
- **Recommendation:** within the spec's order: give `DiscussInClub` one line of copy above the button (new copy fields in `lib/site-copy.ts`: `join.articleLead`, default "Every story continues in {community}." and `join.articleLeadWithCount`, default "{count} comments so far in {community}."), with the count rendered as text rather than a trailing "12 comments" string. Tighten the end sections from `py-8` to `py-6`. Render More to read as compact rows on phones (`StoryCard` with `compactOnPhone`), which halves its height without touching desktop.
- **Cost:** S. Two new copy fields (`join.articleLead`, `join.articleLeadWithCount`), no schema migration since copy fields are additive.
- **Benchmark:** The Athletic ends with one "Read next", a comment count beside the author, and a short list; it never stacks two full cards after a signup.

### F16 The national front leaves a third of the page empty

- **Severity:** Medium
- **Where:** `/national` at 1024px and up, in launch mode and after. `app/(site)/_views/NationalView.tsx:45` passes no `community` and the mock has no national media, so `components/FrontPage.tsx:108` renders an empty 4-column aside.
- **Evidence:** `shots/live/national-1280-light-fold.png`: the text-only lead spans 56rem, then "Latest" with one story at 8 columns and nothing to the right down the whole page.
- **Why it matters:** national is 60 percent of the plan. Its front should look like the flagship, not a stub.
- **Recommendation:** on `/national` pass `community={{ name: copy.join.homeCardHeadline, joinUrl: joinUrlFor(null, settings), findCommunity: true }}` as home does, so the rail shows the "Join the Club" card with the "Find your community" line, which is honest for national readers (it links to `/community`, never to one school's signup). And in `FrontPage`, when there is neither a community card nor media, let Latest span 12 columns rather than leave a gutter: `lg:col-span-8` becomes conditional.
- **Cost:** S. None.
- **Benchmark:** The Ringer's topic fronts always fill the rail with a newsletter or podcast module; an empty column is never shipped.

### F17 Desktop section links are small for a primary nav

- **Severity:** Polish
- **Where:** header second row, 768px and up. `components/HeaderNav.tsx:46` (`label-caps`, 12px, 0.08em).
- **Evidence:** measured 12px caps with 70x43 hit areas; `shots/live/home-1280-light.png`.
- **Why it matters:** the section row is the only place the schools appear on desktop. At 12px it reads as metadata rather than navigation, and with one school it looks thinner still.
- **Recommendation:** 13px (`text-[0.8125rem]`), tracking 0.06em, `py-3.5` for a 48px row, `gap-10`. Keep `label-caps` for kickers at 12px so labels and nav stop being the same size.
- **Cost:** S. None.
- **Benchmark:** The Athletic's section bar sits at 13 to 14px caps, visibly larger than the kickers on cards.

### F18 Story units do not react as one on hover

- **Severity:** Polish
- **Where:** every lead, card, and row on desktop. `styles/globals.css:92` (`story-link` underlines on its own hover only) and `:124` (`photo-zoom` reacts to the `.group`).
- **Evidence:** `shots/states/hover-lead-1280.png`: hovering the photo zooms the photo and leaves the headline unchanged; hovering the headline underlines it and leaves the photo still.
- **Recommendation:** add `:where(.group):hover .story-link { text-decoration-color: currentColor; }` beside the existing rule so the unit responds together. Under reduced motion the underline still appears (no transition needed).
- **Cost:** S. None.
- **Benchmark:** Defector's cards underline the headline when any part of the card is hovered.

### F19 Form error and success states are browser defaults or absent

- **Severity:** Polish
- **Where:** `/newsletter`, the bands, the article form. `components/NewsletterSignup.tsx:60-100`.
- **Evidence:** `shots/states/newsletter-invalid.png`: a malformed address shows the browser's native bubble (different on every platform). Server errors render as 14px muted text with no color change or icon. Success replaces the form with one 16px line.
- **Recommendation:** keep native validation (it is accessible and free) but add `novalidate` plus an inline message in the site's voice on submit: 14px `font-ui`, `--fg`, prefixed by a 2px left rule in the accent, `role="alert"`. On success keep the headline and show the message in `--fg` with a small check mark drawn inline (SVG, no asset). Same pattern for `WriteForUsForm`, which already has the error structure.
- **Cost:** S. Under 1KB of client code.
- **Benchmark:** Defector's signup confirms in the brand voice and stays visually inside the band rather than replacing it.

### F20 The 404 and empty search pages stop the reader

- **Severity:** Polish
- **Where:** `app/(site)/not-found.tsx`, `app/(site)/search/page.tsx:26`.
- **Evidence:** `shots/live/not-found-1280-light.png`: a label, headline, one line, and a plain text link; nothing to read. `shots/live/search-1280-light.png`: the H1 is the 12px "Search" label, and the empty state is a large input over empty paper.
- **Recommendation:** 404: style the link as the outline button used by `CommunityInvite`, and add the three newest stories as `StoryRow`s under a "Latest" rule heading (the `NEWSLETTER_QUERY` already returns three recent stories). Search: make the visible H1 the page title at `PageHeader` size with "Search" as kicker, and show the recent list the client already renders as soon as the index loads, so the page is never blank.
- **Cost:** S. None.
- **Benchmark:** The Ringer's 404 shows the day's top stories; nobody leaves from a dead end.

### F21 Fine print and meta are at the contrast floor on elevated surfaces

- **Severity:** Polish
- **Where:** timestamps and credits in `--fg-subtle` on `--bg-elev` (Join card, community panel, newsletter band) in dark mode. `styles/tokens.css:52`.
- **Evidence:** measured: `--fg-subtle` on `--bg-elev` is 4.98:1 dark, 5.10:1 light; on `--bg` 5.35:1 dark, 4.93:1 light. All pass, but the dark elevated value has 0.5 of headroom and the newsletter band's edge against the page is 1.08:1 in dark (1.03:1 light), so the band relies entirely on its hairline.
- **Recommendation:** no token change needed now. If dark `--bg-elev` is ever lightened for the band, re-check `--fg-subtle` against it; nudging `--fg-subtle` dark to #93928C would give 6.0:1 on `--bg` and 5.6:1 on `--bg-elev` with no visible change.
- **Cost:** S. None.
- **Benchmark:** n/a (preventive).

### F22 Numerals: headlines are proportional, body is tabular, which is the right way round

- **Severity:** Polish (confirmation, with one guard)
- **Where:** `public/fonts/*.woff2`, `styles/globals.css:48` (`time { tabular-nums }`).
- **Evidence:** `shots/states/specimen-light.png` and measured widths. The Fraunces 600 cut has proportional lining figures and its `tnum` feature was dropped in subsetting (no width change when requested). Source Serif 4's cut renders every digit at the same width (tabular lining by default). The system UI face on this machine resolves to Inter; on iOS, SF Pro's default figures are proportional, so "Page 2 of 6" and episode timestamps are covered by the existing `tabular-nums` rules.
- **Why it matters:** scores and records in headlines ("Georgia 24, Texas 17") look right in proportional lining figures; box-score-style numbers in body copy align. If a future recut of Fraunces is made, keep `tnum` out (headlines never need it) and keep the opsz axis.
- **Recommendation:** add `font-variant-numeric: tabular-nums` to `.label-caps` and `StoryMeta` so "Q4 14:02" style kickers and comment counts align in lists on iOS. No font change.
- **Cost:** S. None.

### F23 Brand voice reads as a general serif publication

- **Severity:** Polish (strategic)
- **Where:** wordmark (`components/SiteHeader.tsx:33`), positioning line, copy defaults in `lib/site-copy.ts`.
- **Evidence:** the wordmark is the headline face at 26px; the positioning line is 14px muted. The copy is good ("Built for fans", "The Club", "Join free", "the people who watch every snap") and does more for the brand than the design does.
- **Why it matters:** Speakeasy promises insider and a little irreverent. The page is tasteful and quiet. Nothing is wrong, but nothing winks.
- **Recommendation:** three cheap moves inside the rules. (1) Fraunces has SOFT and WONK axes; the current cut pins both at default. Recut with WONK=1 pinned (the leaning n, the swash-ish a and k) for the wordmark only, as a second tiny instance subset to the letters in "Speakeasy Sports" (about 3KB). (2) Use the editable positioning line for the week, not the mission: "Georgia at Ole Miss, Saturday 3:30 ET" in game weeks. Zero code. (3) Set the wordmark at `text-[1.75rem]` with `tracking-[-0.03em]` on desktop so the masthead has weight against the 44px Newsletter button.
- **Cost:** S for (2) and (3); S to M for (1), about 3KB, inside the font budget.
- **Benchmark:** Defector's masthead is one word with one quirk; the quirk carries the attitude and the rest of the site stays plain.

## 3. Type and spacing scales

### Type scale, current versus recommended

Sizes are phone / desktop in px; leading is unitless; tracking in em. Everything stays on Fraunces 600 and Source Serif 4 400 to 700; no new weight, no new file.

| Role | Current size | Current leading, tracking | Recommended size | Recommended leading, tracking | Where |
| --- | --- | --- | --- | --- | --- |
| Section title (school, National) | 48 / 72 / 88 | 0.95, -0.035 | 48 / 72 / 80 | 0.95, -0.03 | `SchoolHeader.tsx:37`, `NationalView.tsx:39` |
| Page title (index, community, newsletter) | 44 / 64 | 0.98, -0.03 | 44 / 64 | 0.98, -0.03 | `PageHeader.tsx` |
| Lead headline, text only | 36 / 48 / 56 | 1.04, -0.025 | 36 / 48 / 56 | 1.02, -0.03 | `LeadStory.tsx:21` |
| Lead headline, image | 32 / 40 / 46 | 1.06, -0.022 | 32 / 40 / 46 | 1.04, -0.022 | `LeadStory.tsx:46` |
| Article H1 | 36 / 48 | 1.08, -0.018 | 36 / 48 | 1.06, -0.022 | `ArticleView.tsx:128` |
| Newsletter band | 32 / 44 | 1.05, -0.025 | 32 / 40 | 1.05, -0.022 | `NewsletterSignup.tsx:149` |
| Text-only card | 22 / 24 | 1.15, -0.018 | 24 / 28 | 1.1, -0.022 | `StoryCard.tsx:47` |
| Read next, Join card | 26 | 1.1 | 26 | 1.1 | keep |
| Card headline | 19 / 22 | 1.2 | 20 / 22 | 1.18 | `StoryCard.tsx:68` |
| Row headline | 19 / 23 | 1.2 | 19 / 22 | 1.18 | `StoryRow.tsx:27` |
| Rail compact row | 16 | 1.25 | 16 | 1.25 | keep |
| Article dek | 20 / 24 | 1.375 | 20 / 24 | 1.35 | keep |
| Lead dek | 18 / 20 / 24 | 1.375 | 18 / 20 / 22 | 1.375 | `LeadStory.tsx:26` |
| Card and row dek | 16 | 1.375 | 16 | 1.375 | keep; hide on picture rows |
| Body | 18 / 20 | 1.6 | 18 / 20 | 1.6 | keep |
| Body H2 / H3 | 1.5em / 1.2em | 1.2 | same | 1.2 | keep |
| Section nav (desktop) | 12 caps | 0.08 | 13 caps | 0.06 | `HeaderNav.tsx:46` |
| Sub-nav | 14 |  | 14 |  | keep |
| Labels (kickers) | 12 caps | 0.08 | 12 caps | 0.08, tabular-nums | `globals.css:69` |
| Meta, fine print | 13 | 1.0 (meta), 1.6 (fine) | 13 | 1.2 / 1.6, tabular-nums | `StoryMeta.tsx:21` |
| Wordmark | 22 / 26 | -0.02 | 22 / 28 | -0.03 | `SiteHeader.tsx:33` |

### Spacing scale, current versus recommended

| Gap | Current | Recommended | Token |
| --- | --- | --- | --- |
| Inside a story unit (label to headline to dek to meta) | 8 to 10 | 8 / 10 | `--space-2`, 2.5 |
| Between rows in a river | 48 (24 + 24) | 40 (20 + 20) | 5 × `--space-1` |
| Between cards in a row | 32 / 64 at lg | 24 / 64 at lg | `--space-6`, `--space-16` |
| Section header to lead | 32 / 48 | 32 / 48 | `--space-8`, `--space-12` |
| Lead to secondary row | 40 + 32 pad (72) | 32 + 32 pad (64) | `--space-8` |
| Secondary row to Latest | 56 / 80 | 48 / 64 | `--space-12`, `--space-16` |
| Latest to newsletter band | 96 | 64 | `--space-16` |
| Content to footer | 96 | 64 | `--space-16` |
| Article header to body | 0 (text only), 32 (photo) | 32 / 40 both | `--space-8`, 2.5rem |
| Article body to Read next | 56 | 48 | `--space-12` |
| Article end sections | 32 + 32 | 24 + 24 | `--space-6` |
| Article end to More to read | 64 | 48 | `--space-12` |

## 4. Before launch versus after launch

Before launch (cheap and clearly better):

- F1 Studio content: Georgia club URLs and colors, the five pages, author profile, tagline (schools stay out of the nav).
- F2 Email input height (one class).
- F3 Byline-to-body gap on text-only stories.
- F4(a) Three-up secondary row from 640px; F4(b) larger text-only card headline.
- F5 Two-column front from 768px.
- F7 Full-strength body underlines outside school sections.
- F8 OG accent fallback and the larger headline (not the photo variants).
- F9 Button hover via color-mix.
- F10 Touch targets in footer, author card, chips, plus 44px on every button on phones (decision 6).
- F11 Byline avatar container only when a photo exists.
- F16 National rail card.
- F18 Unit-wide hover.
- F22 tabular-nums on labels and meta.

After launch:

- F6 River density (worth a day of looking at real stories first).
- F8 Author photo and hero photo on the share image.
- F12 Full type scale pass and F14 spacing pass (do them together, one PR, with before and after screenshots at 390 and 1280).
- F13 Speakeasy monogram for Georgia in header, Join card, and share image (decision 4; needs the asset).
- F15 Article ending copy and compact More to read.
- F17 Section nav size.
- F19 Form states in the site voice.
- F20 404 and search empty states.
- F21 Dark subtle token headroom (only if the band surface changes).
- F23 Masthead weight and the game-week positioning line; the wordmark cut waits for the real logo (decision 5).

## 5. Already working well

Do not change these by accident.

- The token system and the "ink, not paint" rule. Every color goes through tokens; the accent appears only on kickers, rules, links, focus rings, and buttons. Measured text contrast passes everywhere at rest: body 17.8:1 light, 16.5:1 dark; muted 6.6:1 and 8.9:1; subtle 4.9:1 and 5.4:1; Georgia red 6.4:1 light and 4.9:1 dark on the page.
- Focus rings: 2px accent outline with 2px offset, red inside Georgia units, visible on every link, button, and input (`shots/states/focus-section-1280.png`). The skip link works.
- Text-only stories as a format. The 3px rule on cards and the full-width row are the right idea; the lead at 56px over 56rem is handsome (`shots/local/home-fold-local-1280-dark.png`).
- Dark mode. It is a real design, not an inversion: paper goes to #121210, the Georgia red lifts to #E44A64 with near-black button text, the waveform art moves to the elevated surface. Nothing glows.
- The phone header and menu: wordmark, one filled button, a native `details` menu with 44px rows that works before hydration.
- `MediaArt` for podcasts and videos: seeded waveforms in the accent read as a set and cost no requests.
- The article page reading column: 18/20px Source Serif at 1.6 over a 42rem measure, 1.25em paragraph spacing, display-face H2s, pull quotes with the short accent rule, and the sponsor slot that renders nothing when empty.
- Static fronts with rewrites for pagination, 60s ISR, fonts at 105KB, and a 187KB article page. Nothing in this report adds a request to the reader path except the optional school mark.
- The launch-mode rule (lead plus one list under eight stories). The national front proves it: a thin front still reads as a front, once the rail is filled (F16).
- Copy. "Every story here gets its own thread there, with the people who watch every snap" is better than most sports sites manage.

## Evidence gallery

Click any image for the full capture. The complete set (live and local, four widths, both themes) is in the scratch folder next to the report.

[![](shots/states/newsletter-input-390.png)](shots/states/newsletter-input-390.png)

F2: the email field at 390px, 22px tall beside a 48px button.

[![](shots/live/article-text-390-light.png)](shots/live/article-text-390-light.png)

F3: text-only article on the live site; the byline runs straight into the body.

[![](shots/states/focus-section-1280.png)](shots/states/focus-section-1280.png)

F4 and focus: the text-only card sits high beside two photo cards; the red 2px focus ring on a headline link.

[![](shots/local/home-full-768-light.png)](shots/local/home-full-768-light.png)

F4 and F5: at 768px the third story orphans below the row and the rail sinks under the river.

[![](shots/local/home-full-1280-light.png)](shots/local/home-full-1280-light.png)

F6: a full front with 20 Latest rows at 1280 (mock data).

[![](shots/live/community-1280-light.png)](shots/live/community-1280-light.png)

F1: the Community page on the live site has no club panel.

[![](shots/states/og-saturday-in-athens.png)](shots/states/og-saturday-in-athens.png)

F8: the share image for a Georgia story, with a black kicker bar and an empty middle.

[![](shots/live/national-1280-light-fold.png)](shots/live/national-1280-light-fold.png)

F16: the national front in launch mode, with an empty rail.

[![](shots/local/home-fold-local-1280-dark.png)](shots/local/home-fold-local-1280-dark.png)

Working well: dark mode with a text-only lead and the podcast waveform art.

[![](shots/local/georgia-full-390-light-fold.png)](shots/local/georgia-full-390-light-fold.png)

Working well: the Georgia section header and sub-nav on a phone (mock data).

[![](shots/states/specimen-light.png)](shots/states/specimen-light.png)

F12 and F22: type specimen with scores in Fraunces, body figures in Source Serif, meta in the UI face.

[![](shots/states/menu-open-390.png)](shots/states/menu-open-390.png)

F1: the phone menu on the live site, without Georgia.

## 6. Decisions recorded (October 25, 2026)

Jon's answers to the open questions, and what they change in the lists above.

| # | Question | Decision | Effect on the report |
| --- | --- | --- | --- |
| 1 | Where Georgia's color lives | The Studio is the source; the built-in color stays as a backup | F1 and F8: set `accentColor` and `accentColorDark` on the Georgia document; keep the `tokens.css` block and add the code fallback in the OG route |
| 2 | Text-only card in the front-page row | Typographically heavier | F4(b) as written; the bottom-aligned alternative is dropped |
| 3 | Deks in the Latest list | Drop them on every story with a photo, after launch | F6 stays after launch, scoped to picture rows only |
| 4 | Georgia mark | A Speakeasy-drawn monogram, not the UGA mark | F13: the `logo` field holds a Speakeasy "G" monogram in the accent; no licensing question. Needs the asset before the component work |
| 5 | Quirkier wordmark | Wait for the real logo | F23(1) is parked; F23(2) and (3) stand |
| 6 | Button height on phones | 44px for every button | Moves to before launch: `JoinButton`, `DiscussInClub`, `CommunityInvite`, pagination, and chips get `h-11 sm:h-10` (or `sm:h-9` for chips); the header Newsletter button already does this |
| 7 | Georgia in the footer Sections column | No schools in the footer yet | Schools stay out of the header, phone menu, and footer. The section is reached from the red school label on every Georgia story and from the Join card; F1 keeps those two doors working |
| 8 | Light/dark switch | After launch | Stays out of v1; noted for a later release |

## 7. Open questions for the owner (as asked)

1. Georgia's accent lives in `tokens.css` and the schema. Should the CMS be the single source (set `accentColor` on the Georgia document and delete the hardcoded block), or should the code map stay as the guaranteed fallback? The report recommends both until the Studio value is confirmed in production.
2. The secondary row: do you prefer the text-only card to be typographically heavier (recommended) or bottom-aligned so headlines share a line? Both fit the direction; they look different.
3. Deks on river rows at desktop (F6): keep them for the first five rows and drop them below, or drop them on every picture row? The latter is simpler and matches the phone.
4. School mark (F13): is a Georgia mark something Speakeasy can use under its "not affiliated" footer line? If licensing is a concern, a Speakeasy-drawn "G" monogram in the accent would serve the same purpose.
5. Fraunces WONK for the wordmark (F23): worth 3KB and a recut, or wait for the logo?
6. The header's Newsletter button is 44px on phones and 40px on desktop; the Join buttons are 40px everywhere. Should every filled control be 44px on phones? The report assumes yes.
7. Schools out of the navigation: the section label on stories is now the main door into `/georgia`. Should the footer Sections column list Georgia (via `footerColumns`), or is reaching the section from stories and the Join card enough for launch? Answered: no schools in the footer yet.
8. Fixed decision to reconsider later, not now: "Dark mode follows the system, no toggle" is right for v1. The one place it bites is sharing a screenshot from a dark phone into a light group chat; a toggle in the footer, after launch, costs about 1KB and a cookie-free `data-theme` attribute the CSS already supports.