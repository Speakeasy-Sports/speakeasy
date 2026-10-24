import { defineQuery } from "next-sanity";

// One GROQ query per page, typed with Sanity TypeGen (pnpm typegen regenerates sanity.types.ts).
// Fragments are plain strings so they stay inline for TypeGen.
//
// Paginated lists are written with a literal first-page slice (for example `[0...20]`) so TypeGen can type them.
// lib/sanity/paginate.ts swaps that one slice for the requested page at runtime; keep each marker unique per query.

const IMAGE_FIELDS = /* groq */ `
  asset->{ _id, url, metadata { lqip, dimensions { width, height } } },
  hotspot,
  crop,
  alt,
  caption,
  credit
`;

const SCHOOL_REF_FIELDS = /* groq */ `
  _id,
  name,
  shortName,
  "slug": slug.current,
  communityName,
  circleJoinUrl,
  accentColor,
  accentColorDark
`;

const NAV_TAG_FIELDS = /* groq */ `
  "navTags": navTags[]->{ _id, name, "slug": slug.current }
`;

const AUTHOR_PHOTO = /* groq */ `
  photo { asset->{ _id, url, metadata { lqip } }, hotspot, crop, alt }
`;

const AUTHOR_REF_FIELDS = /* groq */ `
  _id,
  name,
  "slug": slug.current,
  role,
  bio,
  ${AUTHOR_PHOTO},
  socialLinks[]{ _key, platform, url }
`;

// Coverage scope (docs/specs/phase-1-ux-update.md, 3.1). Articles saved before the field existed are school stories,
// so every test is written as "is national" and a missing value reads as school.
const NATIONAL = /* groq */ `coverageScope == "national"`;
// Canonical path: /national/{slug} for national stories, /{primarySchool}/{slug} for school stories.
const PATH = /* groq */ `select(${NATIONAL} => "/national/" + slug.current, "/" + primarySchool->slug.current + "/" + slug.current)`;
// The school a story belongs to, or null for national stories (their related schools are in `schools`).
const SCHOOL_OF = /* groq */ `select(${NATIONAL} => null, primarySchool->{ ${SCHOOL_REF_FIELDS} })`;
const SCOPE = /* groq */ `"scope": select(${NATIONAL} => "national", "school")`;

const CARD_FIELDS = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  dek,
  contentType,
  heroType,
  publishedAt,
  ${SCOPE},
  "path": ${PATH},
  "school": ${SCHOOL_OF},
  "authors": authors[]->{ _id, name, "slug": slug.current, ${AUTHOR_PHOTO} },
  heroImage { ${IMAGE_FIELDS} },
  heroEmbed { provider, url, title }
`;

// What counts as live: any article in the published perspective with a slug and either national scope or a primary
// school.
// Site queries never filter on `status`. It is a Studio workflow field; Sanity's publish action (immediate or scheduled)
// is the only thing that moves a document into the published perspective, and draft mode reads the drafts perspective
// so editors can preview any status. Filtering on status here is what broke preview and hid freshly published stories.
const LIVE = /* groq */ `_type == "article" && defined(slug.current) && (${NATIONAL} || defined(primarySchool))`;
const BY_DATE = /* groq */ `order(coalesce(publishedAt, _createdAt) desc)`;

// Front-page order: newest first, with _id breaking ties so the same data always gives the same order.
const FRONT_ORDER = /* groq */ `order(coalesce(publishedAt, _createdAt) desc, _id asc)`;
// The curated lead (Site settings > Editorial), when it is live and belongs on the front being built.
const PINNED = /* groq */ `*[_id == "siteSettings"][0].homepageLead._ref`;

const MEDIA_TYPES = /* groq */ `["podcast", "video"]`;

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_id == "siteSettings"][0]{
    siteName,
    tagline,
    defaultOgImage { asset->{ _id, url }, alt },
    socialLinks[]{ _key, platform, url },
    footerText,
    joinUrl,
    newsletterHeadline,
    newsletterBlurb,
    newsletterSampleUrl,
    "navSchools": navSchools[]->{ ${SCHOOL_REF_FIELDS} },
    menuLinks[]{ label, href },
    footerColumns[]{ title, links[]{ label, href } },
    legalLinks[]{ label, href },
    copy,
    pageSeo
  }
`);

// What the site has published so far, so launch-stage pages hide what would be empty (AGENTS.md section 6, Launch mode).
// Podcasts and Videos links appear with the first episode; card bylines return when a second author publishes.
export const SITE_SIGNALS_QUERY = defineQuery(`
  {
    "articles": count(*[${LIVE}]),
    "podcasts": count(*[${LIVE} && contentType == "podcast"]),
    "videos": count(*[${LIVE} && contentType == "video"]),
    "authors": count(*[_type == "author" && count(*[${LIVE} && references(^._id)]) > 0])
  }
`);

// Fronts are built in two steps (docs/specs/phase-1-ux-update.md, 4.1). The picks query names the lead (the curated
// homepageLead if it is live on this front, else the newest story) and the newest stories after it; lib/fronts.ts turns
// that into the lead and three supporting stories. The front query then takes those ids as $lead and $supporting and
// excludes them from Latest on every page, so pagination never repeats or skips a story.
export const HOME_PICKS_QUERY = defineQuery(`
  {
    "pinned": *[${LIVE} && _id == ${PINNED}][0]._id,
    "newest": (*[${LIVE}] | ${FRONT_ORDER})[0...4]._id
  }
`);

export const HOME_QUERY = defineQuery(`
  {
    "lead": *[${LIVE} && _id == $lead][0]{ ${CARD_FIELDS} },
    "supporting": *[${LIVE} && _id in $supporting] | ${FRONT_ORDER} { ${CARD_FIELDS} },
    "latest": *[${LIVE} && _id != $lead && !(_id in $supporting)] | ${FRONT_ORDER} [0...20]{ ${CARD_FIELDS} },
    "count": count(*[${LIVE}]),
    "media": *[
      ${LIVE} && contentType in ${MEDIA_TYPES} && _id != $lead && !(_id in $supporting)
    ] | ${FRONT_ORDER} [0...4]{ ${CARD_FIELDS} }
  }
`);

export const SCHOOL_SLUGS_QUERY = defineQuery(`
  *[_type == "school" && defined(slug.current)]{ "slug": slug.current }
`);

// A national story associated with the school is part of its front (and links to /national).
const IN_SCHOOL = /* groq */ `^._id in schools[]._ref`;

export const SCHOOL_PICKS_QUERY = defineQuery(`
  *[_type == "school" && slug.current == $slug][0]{
    "pinned": *[${LIVE} && ${IN_SCHOOL} && _id == ${PINNED}][0]._id,
    "newest": (*[${LIVE} && ${IN_SCHOOL}] | ${FRONT_ORDER})[0...4]._id
  }
`);

export const SCHOOL_FRONT_QUERY = defineQuery(`
  *[_type == "school" && slug.current == $slug][0]{
    ${SCHOOL_REF_FIELDS},
    mascot,
    description,
    seoTitle,
    seoDescription,
    ${NAV_TAG_FIELDS},
    "lead": *[${LIVE} && ${IN_SCHOOL} && _id == $lead][0]{ ${CARD_FIELDS} },
    "supporting": *[${LIVE} && ${IN_SCHOOL} && _id in $supporting] | ${FRONT_ORDER} { ${CARD_FIELDS} },
    "latest": *[${LIVE} && ${IN_SCHOOL} && _id != $lead && !(_id in $supporting)] | ${FRONT_ORDER} [0...20]{ ${CARD_FIELDS} },
    "count": count(*[${LIVE} && ${IN_SCHOOL}]),
    "media": *[
      ${LIVE} && ${IN_SCHOOL} && contentType in ${MEDIA_TYPES} && _id != $lead && !(_id in $supporting)
    ] | ${FRONT_ORDER} [0...4]{ ${CARD_FIELDS} }
  }
`);

// /national: the same front as a school, scoped to national stories.
export const NATIONAL_PICKS_QUERY = defineQuery(`
  {
    "pinned": *[${LIVE} && ${NATIONAL} && _id == ${PINNED}][0]._id,
    "newest": (*[${LIVE} && ${NATIONAL}] | ${FRONT_ORDER})[0...4]._id
  }
`);

export const NATIONAL_FRONT_QUERY = defineQuery(`
  {
    "lead": *[${LIVE} && ${NATIONAL} && _id == $lead][0]{ ${CARD_FIELDS} },
    "supporting": *[${LIVE} && ${NATIONAL} && _id in $supporting] | ${FRONT_ORDER} { ${CARD_FIELDS} },
    "latest": *[${LIVE} && ${NATIONAL} && _id != $lead && !(_id in $supporting)] | ${FRONT_ORDER} [0...20]{ ${CARD_FIELDS} },
    "count": count(*[${LIVE} && ${NATIONAL}]),
    "media": *[
      ${LIVE} && ${NATIONAL} && contentType in ${MEDIA_TYPES} && _id != $lead && !(_id in $supporting)
    ] | ${FRONT_ORDER} [0...4]{ ${CARD_FIELDS} }
  }
`);

// /community: every school with an open club (a join URL), in nav order.
export const COMMUNITY_QUERY = defineQuery(`
  *[_type == "school" && defined(circleJoinUrl)] | order(order asc, name asc){
    ${SCHOOL_REF_FIELDS},
    description,
    circleSignInUrl
  }
`);

export const AUTHOR_QUERY = defineQuery(`
  *[_type == "author" && slug.current == $slug][0]{
    ${AUTHOR_REF_FIELDS},
    "schools": schools[]->{ ${SCHOOL_REF_FIELDS} },
    "articles": *[${LIVE} && ^._id in authors[]._ref] | ${BY_DATE} [0...12]{ ${CARD_FIELDS} },
    "count": count(*[${LIVE} && ^._id in authors[]._ref])
  }
`);

// $school is a school slug or "" for all schools.
export const TAG_QUERY = defineQuery(`
  *[_type == "tag" && slug.current == $slug][0]{
    _id,
    name,
    "slug": slug.current,
    description,
    "school": *[_type == "school" && slug.current == $school][0]{ ${SCHOOL_REF_FIELDS}, ${NAV_TAG_FIELDS} },
    "schools": *[_type == "school" && count(*[${LIVE} && ^.^._id in tags[]._ref && ^._id in schools[]._ref]) > 0]
      | order(order asc, name asc){ _id, name, shortName, "slug": slug.current },
    "articles": *[${LIVE} && ^._id in tags[]._ref && ($school == "" || $school in schools[]->slug.current)]
      | ${BY_DATE} [0...16]{ ${CARD_FIELDS} },
    "count": count(*[${LIVE} && ^._id in tags[]._ref && ($school == "" || $school in schools[]->slug.current)])
  }
`);

// $type is "podcast" or "video"; $school is a school slug or "".
export const MEDIA_QUERY = defineQuery(`
  {
    "school": *[_type == "school" && slug.current == $school][0]{ ${SCHOOL_REF_FIELDS}, ${NAV_TAG_FIELDS} },
    "schools": *[_type == "school" && count(*[${LIVE} && contentType == $type && ^._id in schools[]._ref]) > 0]
      | order(order asc, name asc){ _id, name, shortName, "slug": slug.current },
    "articles": *[${LIVE} && contentType == $type && ($school == "" || $school in schools[]->slug.current)]
      | ${BY_DATE} [0...24]{ ${CARD_FIELDS}, episodeSummary },
    "count": count(*[${LIVE} && contentType == $type && ($school == "" || $school in schools[]->slug.current)])
  }
`);

export const ARTICLE_QUERY = defineQuery(`
  *[${LIVE} && slug.current == $slug][0]{
    _id,
    _updatedAt,
    title,
    "slug": slug.current,
    dek,
    contentType,
    status,
    publishedAt,
    updatedAt,
    correction,
    memberOnly,
    noIndex,
    seoTitle,
    seoDescription,
    ogImageOverride { asset->{ _id, url }, alt },
    ${SCOPE},
    "path": ${PATH},
    "school": ${SCHOOL_OF},
    "schools": schools[]->{ _id, "slug": slug.current },
    "authors": authors[]->{ ${AUTHOR_REF_FIELDS} },
    "tags": tags[]->{ _id, name, "slug": slug.current },
    heroType,
    heroImage { ${IMAGE_FIELDS} },
    heroEmbed { provider, url, title },
    episodeSummary,
    episodeTimestamps[]{ _key, time, label },
    body[]{
      ...,
      _type == "imageBlock" => { ${IMAGE_FIELDS} },
      markDefs[]{ ..., _type == "link" => { href } }
    },
    circlePostUrl,
    circleCommentCount,
    "related": *[
      ${LIVE} && _id != ^._id
      && select(^.coverageScope == "national" => ${NATIONAL}, !(${NATIONAL}) && primarySchool._ref == ^.primarySchool._ref)
    ] | order(coalesce(count((tags[]._ref)[@ in ^.^.tags[]._ref]), 0) desc, coalesce(publishedAt, _createdAt) desc) [0...3] { ${CARD_FIELDS} },
    "sponsor": *[
      _type == "sponsorSlot" && active == true && placement == "articleBelowHero"
      && (!defined(startDate) || startDate <= now())
      && (!defined(endDate) || endDate >= now())
      && (count(schools) == 0 || !defined(schools) || ^.primarySchool._ref in schools[]._ref)
    ] | order(_updatedAt desc) [0] {
      _id, sponsorName, headline, url, label, logo { asset->{ _id, url }, alt }
    }
  }
`);

export const ARTICLE_OG_QUERY = defineQuery(`
  *[${LIVE} && slug.current == $slug][0]{
    title,
    dek,
    contentType,
    ${SCOPE},
    "school": select(${NATIONAL} => null, primarySchool->{ shortName, accentColor, "slug": slug.current }),
    "authors": authors[]->{ name }
  }
`);

// Prerendered at build time (generateStaticParams). Older articles render on first request and are then cached.
export const ARTICLE_SLUGS_QUERY = defineQuery(`
  *[${LIVE}] | ${BY_DATE} [0...100] {
    "slug": slug.current,
    ${SCOPE},
    "school": select(${NATIONAL} => null, primarySchool->slug.current)
  }
`);

export const NEWSLETTER_QUERY = defineQuery(`
  *[${LIVE}] | ${BY_DATE} [0...3]{ ${CARD_FIELDS} }
`);

export const INFO_PAGE_QUERY = defineQuery(`
  *[_type == "infoPage" && slug.current == $slug][0]{
    _id,
    _updatedAt,
    title,
    "slug": slug.current,
    intro,
    body[]{
      ...,
      _type == "imageBlock" => { ${IMAGE_FIELDS} },
      markDefs[]{ ..., _type == "link" => { href } }
    }
  }
`);

// Client-side search index (AGENTS.md section 6). Short keys keep the JSON small: about 300 bytes per article.
export const SEARCH_INDEX_QUERY = defineQuery(`
  *[${LIVE} && noIndex != true] | ${BY_DATE} [0...5000]{
    "t": title,
    "d": dek,
    "u": ${PATH},
    "s": select(${NATIONAL} => "National", primarySchool->shortName),
    "k": contentType,
    "a": authors[]->name,
    "g": tags[]->name,
    "p": coalesce(publishedAt, _createdAt)
  }
`);

const FEED_ITEM = /* groq */ `
  _id,
  title,
  dek,
  "slug": slug.current,
  contentType,
  "path": ${PATH},
  "school": select(${NATIONAL} => null, primarySchool->{ shortName, "slug": slug.current }),
  "authors": authors[]->name,
  "tags": tags[]->name,
  "published": coalesce(publishedAt, _createdAt),
  "image": heroImage.asset->url
`;

export const FEED_QUERY = defineQuery(`
  *[${LIVE} && noIndex != true] | ${BY_DATE} [0...50]{ ${FEED_ITEM} }
`);

export const SCHOOL_FEED_QUERY = defineQuery(`
  *[_type == "school" && slug.current == $slug][0]{
    name,
    shortName,
    description,
    "slug": slug.current,
    "items": *[${LIVE} && noIndex != true && ^._id in schools[]._ref] | ${BY_DATE} [0...50]{ ${FEED_ITEM} }
  }
`);

export const SITEMAP_QUERY = defineQuery(`
  {
    "articles": *[${LIVE} && noIndex != true]{
      "path": ${PATH},
      "updated": coalesce(updatedAt, _updatedAt)
    },
    "schools": *[_type == "school" && defined(slug.current)]{ "slug": slug.current, "updated": _updatedAt },
    "authors": *[_type == "author" && defined(slug.current)]{ "slug": slug.current, "updated": _updatedAt },
    "tags": *[_type == "tag" && defined(slug.current)]{ "slug": slug.current, "updated": _updatedAt },
    "pages": *[_type == "infoPage" && defined(slug.current)]{ "slug": slug.current, "updated": _updatedAt }
  }
`);

// Webhook handler reads (raw perspective, by exact id, write client). Not used by any page.
export const ARTICLE_SYNC_QUERY = defineQuery(`
  {
    "article": *[_type == "article" && _id == $id][0]{
      _id,
      title,
      dek,
      "slug": slug.current,
      status,
      publishedAt,
      circlePostId,
      circleSyncError,
      ${SCOPE},
      "school": select(${NATIONAL} => null, primarySchool->{ "slug": slug.current, circleSpaceId }),
      "heroImageUrl": heroImage.asset->url
    },
    "versions": *[sanity::versionOf($id) && _id != $id]._id
  }
`);

export const REVIEW_NOTIFY_QUERY = defineQuery(`
  *[_type == "article" && _id == $id][0]{
    _id,
    title,
    dek,
    "authors": authors[]->name,
    "school": select(${NATIONAL} => "National", primarySchool->shortName)
  }
`);

export const ARTICLE_BY_CIRCLE_POST_QUERY = defineQuery(`
  *[_type == "article" && circlePostId == $postId && !(_id in path("drafts.**")) && !(_id in path("versions.**"))][0]{
    _id,
    "slug": slug.current,
    circleCommentCount,
    "versions": *[sanity::versionOf(^._id) && _id != ^._id]._id
  }
`);

// Daily job (AGENTS.md 7.2 step 4, 7.3): sync errors, recent articles never posted, and recent counts to refresh.
export const CIRCLE_DAILY_QUERY = defineQuery(`
  {
    "retry": *[
      _type == "article" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))
      && (defined(circleSyncError) || (!defined(circlePostId) && !(${NATIONAL}) && coalesce(publishedAt, _createdAt) > $postSince))
    ] | order(coalesce(publishedAt, _createdAt) desc) [0...20]._id,
    "counts": *[
      _type == "article" && defined(circlePostId) && !(_id in path("drafts.**")) && !(_id in path("versions.**"))
      && coalesce(publishedAt, _createdAt) > $countSince
    ] | order(coalesce(publishedAt, _createdAt) desc) [0...50].circlePostId
  }
`);
