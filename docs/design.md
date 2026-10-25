# Design reference

Status: October 20, 2026. Describes the site as built in `components/`, `styles/tokens.css`, and `styles/globals.css`. AGENTS.md section 8 holds the token values and is the source of truth; this file explains how they are used. Update both when the design changes.

## Direction

An editorial print feel: a newspaper front page on warm paper, not an app.

- **Paper and ink.** Warm white background (`--bg` #FCFBF8), near-black text (`--fg` #141414). `--bg-elev` (#FFFFFF) is used sparingly for bands and frames behind photos.
- **Serif for reading, sans for working.** Headlines and the wordmark set in Fraunces; decks and body in Source Serif 4. Labels, meta, buttons, forms, and navigation set in the system sans (`--font-ui`).
- **Hairlines, not boxes.** Structure comes from 1px rules in `--line` and whitespace. Avoid bordered cards, drop shadows, and filled panels. A 3px accent rule marks the current section and the top of a school front.
- **Square photos.** Photo corners are square. `--radius` (6px) is for controls only: buttons, inputs, the menu toggle.
- **Accent is ink, not paint.** The school accent appears on kickers (type and school labels), rules, links in body text, focus rings, and the join button. Never as a page or section background.
- **Contrast.** Body text and accent on background pass 4.5:1 in both themes. `SchoolTheme` enforces this for CMS colors.
- **Dark mode follows the system.** No toggle in v1. `data-theme` on `<html>` is a test hook only.
- **Quiet motion.** Underline fades and a slight photo zoom on hover. No autoplay, no modals, no sticky video. Every transition is disabled under `prefers-reduced-motion` where it moves anything.

## Color

All color goes through tokens. Tailwind exposes them as `bg-bg`, `bg-bg-elev`, `text-fg`, `text-fg-muted`, `text-fg-subtle`, `border-line`, `text-accent`, `bg-accent`, `text-accent-fg` (the default palette is cleared in `globals.css`, so a raw `text-red-600` does not exist). The only literal colors outside the token files are `white`, `black`, and `transparent`, plus the `themeColor` values in `app/layout.tsx`, which must match `--bg`.

| Token | Use | Light | Dark |
|---|---|---|---|
| `--bg` | Page | #FCFBF8 | #121210 |
| `--bg-elev` | Photo frames, newsletter band, rail promo | #FFFFFF | #1A1A17 |
| `--fg` | Headlines, body, names | #141414 (17.8:1) | #F2F0EA (16.5:1) |
| `--fg-muted` | Decks, captions, secondary copy | #5B5B57 (6.6:1) | #B5B3AC (8.9:1) |
| `--fg-subtle` | Timestamps, fine print, credits. The floor for small text | #6F6E6A (4.9:1) | #8A8984 (5.4:1) |
| `--line` | Hairline rules and dividers. Never text | #E6E3DC | #2A2A26 |
| `--accent` | See rules above | #141414 outside a school | #F2F0EA outside a school |
| `--accent-fg` | Text on the join and discuss buttons | #FFFFFF | #121210 |

Ratios are against `--bg`.

**School accents.** A section sets `data-school="{slug}"` on a wrapper, and the accent tokens are scoped to it. Georgia is hardcoded in `tokens.css` (light #BA0C2F, 6.4:1; dark #E44A64, 4.9:1 on `--bg` and 4.5:1 on `--bg-elev`, with `--accent-fg` flipped to near-black). Every other school comes from the CMS through `SchoolTheme`, which pushes `accentColor` and `accentColorDark` to 4.5:1 and picks the button text color. Dark overrides must live inside the `prefers-color-scheme: dark` query or under `:root[data-theme="dark"]`; see the note in AGENTS.md section 8.

Story units on mixed fronts carry their own `data-school`, so a Georgia story on the home page shows Georgia red labels.

## Type

Two families, loaded in `lib/fonts.ts` with `next/font/local`. Fraunces (`--font-fraunces`) is cut to weight 600 with its optical-size axis kept, so small headlines stay sturdy and large ones get finer detail; it is preloaded. Source Serif 4 is cut to weights 400 to 700, one file each for roman and italic. The roman is `--font-serif` and is preloaded. The italic is a separate `next/font` family, `--font-serif-italic`, that is not preloaded: it only appears below the first screen (body emphasis, pull quotes), and preloading it cost about 0.7s of article LCP on Lighthouse mobile. `globals.css` applies it to `.article-body em` and `.font-display.italic`; any new serif italic needs a selector there.

| Token | Family | Use |
|---|---|---|
| `--font-display` | Fraunces (600, optical size 9 to 144) | Headlines, wordmark |
| `--font-body` | Source Serif 4 (400 to 700) | Body, decks, pull quotes (italic) |
| `--font-ui` | `system-ui` stack | Labels, meta, buttons, forms, nav, captions |

Body: `--text-body` 18px on phones, 20px from 768px, `--leading-body` 1.6, `--measure` 42rem. Base styles turn on balanced wrapping for h1 to h3, pretty wrapping for paragraphs, common ligatures, and tabular numerals in `<time>`.

### Scale as built

| Role | Size (phone / sm / lg) | Notes |
|---|---|---|
| School front title | 48 / 72 / 88px | `headline`, leading 0.95, tracking -0.035em |
| Index page title (`PageHeader`) | 44 / 64px | leading 0.98, tracking -0.03em |
| Article H1 | 36 / 48px (md) | `headline`, leading 1.08 |
| Lead story | 32 / 40 / 46px | leading 1.06 |
| Newsletter band | 32 / 44px | |
| Wordmark | 22 / 26px (md) | semibold, tracking -0.02em |
| Rail promo title | 26px | |
| Story card, story row | 19 / 22 to 23px | leading 1.2 |
| Compact row | 16px | |
| Article dek | 20 / 24px (md) | `text-fg-muted` |
| Lead dek | 18 / 20px (lg) | |
| Body H2, H3 | 1.5em, 1.2em | display face, margin-top 2em |
| Pull quote | 24 / 32px (md) | display italic, 500 |
| UI text | 14 to 15px | buttons, nav, footer links |
| Meta | 13px | `StoryMeta`, fine print |
| Labels | 12px | `label-caps` |

Headline weight is 600 throughout; the wordmark is 700.

## Spacing and layout

- Spacing tokens `--space-1` to `--space-16` (4 to 64px). Tailwind's default spacing scale is used in components; prefer its 4px steps.
- Page width: `shell` (76rem max, 16px gutters on phones, 24px from 640px). Header, fronts, article, and footer share it.
- Article column: one centered reading column at `--measure` for the header, body, and end block. The hero photo and players run wider (`max-w-4xl`, 56rem), centered over it. The end block (discuss, author, newsletter) is a stack of sections divided by hairlines.
- Fronts: a 12-column grid at `lg`. Lead story 7/5, secondary row of three equal columns divided by vertical hairlines (`column-rules`), then Latest (8 columns) beside a sticky rail (4 columns).
- Breakpoints: Tailwind defaults plus `xs` at 390px. The header collapses to wordmark, Join, and menu below `md`. Check every change at 390px.
- Rhythm between front sections: 56px on phones, 80px at `lg`. Story rows are 24px top and bottom, divided by `--line`.

## Utilities

Defined in `styles/globals.css` with `@utility`, so they compose with Tailwind classes.

| Utility | What it does | Use on |
|---|---|---|
| `shell` | Centered page container, 76rem, responsive gutters | Header, main, footer, bands |
| `headline` | Display face, 600, tracking -0.018em, leading 1.12, balanced. Size set per use | Every headline except body H2 and H3 |
| `story-link` | No underline at rest; a thin underline fades in on hover and focus | Headline links in story units |
| `rule-heading` | 12px caps label followed by a hairline to the edge | Section heads: Latest, Listen and watch |
| `photo-zoom` | 3% scale over 600ms when the parent `.group` is hovered; off under reduced motion | Images inside story units |
| `measure` | `max-width: var(--measure)`, centered | The article header, end block, and reading-width blocks outside the body |
| `column-rules` | A hairline centered in each gap of a grid set with `gap-x-16`. Columns stay equal width | The secondary row on the fronts |
| `label-caps` | UI face, 12px, 600, 0.08em tracking, uppercase | Kickers, labels, footer column heads |

`.article-body` (plain CSS, so Portable Text output stays bare HTML) sets body rhythm: 1.25em between blocks, accent links with a 40% accent underline, a 3px accent rule on blockquotes, and UI-face captions.

## Components

Grouped by where they appear. Server components unless marked client.

### Chrome
- **`SiteHeader`**: 64px masthead with a bottom hairline. Desktop: `HeaderNav` left, wordmark centered, search icon and `JoinButton` right. Phone: wordmark, Join, `MobileMenu`.
- **`HeaderNav`** (client): school and section links in `label-caps`, muted until current; the current one gets `aria-current` and a 3px accent underline in its own school's color. `MobileMenu` is a native `<details>` dropdown (works before hydration), elevated surface with a shadow.
- **`SchoolHeader`**: section front header. Community name as an accent kicker, very large school name, description and join button right-aligned, then a 3px accent rule and `SchoolNav`. A compact variant serves podcasts, videos, and tags filtered to the school.
- **`SchoolNav`**: Latest, Podcasts, Videos, a short vertical hairline, then up to six curated tags. 48px tall, scrolls sideways on phones, current item in semibold with a 3px accent underline.
- **`SchoolTheme`**: emits the scoped accent tokens for a CMS school, contrast-corrected.
- **`PageHeader`**: index page title with optional accent kicker and intro, closed by a hairline.
- **`Footer`**: a full-strength `--fg` top rule, 96px below the content, or directly under the newsletter band when the page ends in one. Wordmark and tagline, link columns in UI face, then a hairline and fine print with the "Built for fans" line.

### Front units
- **`FrontPage`**: assembles lead, secondary row, Latest river with `Pagination`, and the rail (`JoinCard`, `MediaRail`). Pages 2 and up show the river only.
- **`LeadStory`**: 1200px photo (priority) at 7 of 12 columns, labels, headline, dek, and meta with author photo. Text only: no image column; headline 36/48/56px across up to 56rem, dek 18 to 24px.
- **`StoryCard`**: 16:9 photo above labels, headline, dek, meta. With `compactOnPhone`, becomes a text-left, thumbnail-right row on phones. Text only: a 3px top rule in the section color (`--accent` for a school story, `--fg` for national), headline a step larger, dek always shown.
- **`StoryRow`**: river unit. Text left, small 16:9 photo right (104px phone, 176px desktop). Dek hidden on phones. Text only: full width, no thumbnail column, dek shown on phones. `CompactRow` is the rail version with a 72px square.
- **`StoryImage`**: the picture for any story unit. Hero photo, else the YouTube frame, else `MediaArt` (podcasts and videos). `hasPicture()` decides whether a unit gets a picture at all: written stories without a photo get none. Fixed aspect box, decorative (`alt=""`, hidden from assistive tech), optional Listen or Watch pill.
- **`MediaArt`**: SVG waveform seeded from the title, for media stories without a photo. Neutral panel (5% `--fg` on `--bg` in light mode, `--bg-elev` in dark, where the tint left Georgia's dark accent at 4.39:1) with the accent only on the bars and play button. The school label shows only when the frame is at least 16rem wide, a container query, so thumbnails stay clean. No requests.
- **`MediaRail`**: "Listen and watch" `rule-heading` and compact rows, links to all podcasts and videos.
- **`JoinCard`**: rail promo for the Circle community on an elevated surface with a 3px accent top rule.
- **`TypeLabel`, `SchoolLabel`, `LabelRow`** (`Labels.tsx`): accent `label-caps`, "Type · School". The school is dropped inside its own section.
- **`StoryMeta`**: 13px UI meta, "Name · 2 hours ago", optional 28px round author photo.
- **`FilterChips`**: pill links for the school filter; the active chip inverts to `--fg`.
- **`Pagination`**: Newer and Older buttons around "Page 2 of 6".

### Article
- **`Byline`**: overlapping 40px round author photos, linked names, `<time>` for publish and update.
- **`HeroImage`**: 16:9 priority image, square corners, with caption in `--fg-muted` and credit in `--fg-subtle`.
- **`MediaFrame`**: fixed 16:9 or fixed-height box, square corners, that holds a player so nothing shifts.
- **`YouTubeEmbed`** (client): thumbnail facade with an accent play button; the iframe loads on click and fires `video_play`.
- **`PodcastEmbed`** (client): Spotify or Apple iframe in a `MediaFrame`, lazy below the fold, fires `podcast_play`.
- **`EpisodeNotes`**: summary and a hairline-ruled timestamp list with accent times, under podcast and video heroes.
- **`SocialEmbed`** (client): official X, Instagram, or TikTok script near the viewport; the plain link renders first and stays as the fallback.
- **`PortableTextRenderer`**: maps the section 5 blocks to `.article-body` HTML and the components here.
- **`PullQuote`**: a short 3px accent rule, then the display italic at 24 to 32px, attribution in `label-caps`.
- **`Callout`**: UI face between rules: the info variant opens with a 3px accent rule, the note variant with a hairline. Both close with a hairline. No fill.
- **`SponsorSlot`**: renders only when a slot matches. "Presented by" label, logo, name, headline between two hairlines.
- **`CorrectionNote`**: 2px left rule, UI face, "Correction" label.
- **`DiscussInClub`** (client): accent button to the Circle post with the comment count; before the post exists it reads "Join {community}" and links to the join URL. Fires `discuss_click` (or `join_click` before the post). `CommunityInvite` (outline button to `/community`) replaces it on national stories and schools without a club. `ReadNext` sits between the body and the end block.
- **`AuthorCard`**: photo, name, role, bio, socials. No box; the end block's hairlines separate it.
- **`NewsletterSignup`** (client): `inline` (article end, no box), `band` (full width on `--bg-elev`, directly above the footer), `page` (form only). "You are on the list" state on success (editable in Site settings > Copy; it promises the next issue, not a confirmation email). Fires `newsletter_signup`.
- **`RelatedStories`**: "More to read" under a hairline, three `StoryCard`s.
- **`JoinButton`** (client): the one filled accent control, 40px tall. Fires `join_click` with its location.

### Not yet built
- **`JoinWall`**: Phase 2.

## Where the build departs from the direction

What is left after the October 20, 2026 cleanup (square photo corners, hairlines in place of boxes, no accent fills, one headline style).

| Where | Departure | Direction says |
|---|---|---|
| `MobileMenu` | Drop shadow | No shadows |
| `Pagination`, `FilterChips` | Boxed buttons and pills | Probably fine as controls; decide |

## Photography

Budget $100 to $300 a month, owned or directly licensed images only. Text-only stories are a normal format, not a fallback: use a photo when it adds something. Licenses must cover the website, newsletter, social posts, and Circle previews. No image service, scraping, or agency integration. Every photo keeps alt text, caption, and credit.

## Checklist for design changes

- Change values in `styles/tokens.css` (and AGENTS.md section 8), not in components.
- Check light and dark, and 390px width, against the mock dataset (docs/setup.md section 4).
- Contrast 4.5:1 for text and accent in both themes.
- JS budget from AGENTS.md section 10: article page under 200KB gzipped, site code under 40KB. Fonts under 120KB.
- Lighthouse 95+ on home, school, and article.
- UI copy in American English, no em-dashes, no emojis.
