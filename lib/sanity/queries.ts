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

const CARD_FIELDS = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  dek,
  contentType,
  heroType,
  publishedAt,
  "school": primarySchool->{ ${SCHOOL_REF_FIELDS} },
  "authors": authors[]->{ _id, name, "slug": slug.current, ${AUTHOR_PHOTO} },
  heroImage { ${IMAGE_FIELDS} },
  heroEmbed { provider, url, title }
`;

// What counts as live: any article in the published perspective with a slug and a primary school.
// Site queries never filter on `status`. It is a Studio workflow field; Sanity's publish action (immediate or scheduled)
// is the only thing that moves a document into the published perspective, and draft mode reads the drafts perspective
// so editors can preview any status. Filtering on status here is what broke preview and hid freshly published stories.
const LIVE = /* groq */ `_type == "article" && defined(slug.current) && defined(primarySchool)`;
const BY_DATE = /* groq */ `order(coalesce(publishedAt, _createdAt) desc)`;

// Front-page order: featured ranks 1 to 4 first (a newer story wins a tied rank), then everything else newest first.
// The first four of this order are the "top stories"; with nothing featured they are simply the four newest.
// The Latest list excludes exactly those four, on every page, so pagination never repeats or skips a story.
const TOP_ORDER = /* groq */ `order(select(featured == true && featuredRank in 1..4 => featuredRank, 99) asc, coalesce(publishedAt, _createdAt) desc)`;

const MEDIA_TYPES = /* groq */ `["podcast", "video"]`;

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_id == "siteSettings"][0]{
    siteName,
    tagline,
    defaultOgImage { asset->{ _id, url } },
    socialLinks[]{ _key, platform, url },
    footerText,
    joinUrl,
    newsletterHeadline,
    newsletterBlurb,
    newsletterSampleUrl,
    "navSchools": navSchools[]->{ ${SCHOOL_REF_FIELDS} }
  }
`);

export const HOME_QUERY = defineQuery(`
  {
    "top": (*[${LIVE}] | ${TOP_ORDER})[0...4]{ ${CARD_FIELDS} },
    "latest": *[${LIVE} && !(_id in ((*[${LIVE}] | ${TOP_ORDER})[0...4]._id))] | ${BY_DATE} [0...20]{ ${CARD_FIELDS} },
    "count": count(*[${LIVE}]),
    "media": *[
      ${LIVE} && contentType in ${MEDIA_TYPES}
      && !(_id in ((*[${LIVE}] | ${TOP_ORDER})[0...4]._id))
    ] | ${BY_DATE} [0...4]{ ${CARD_FIELDS} }
  }
`);

export const SCHOOL_SLUGS_QUERY = defineQuery(`
  *[_type == "school" && defined(slug.current)]{ "slug": slug.current }
`);

export const SCHOOL_FRONT_QUERY = defineQuery(`
  *[_type == "school" && slug.current == $slug][0]{
    ${SCHOOL_REF_FIELDS},
    mascot,
    description,
    seoTitle,
    seoDescription,
    ${NAV_TAG_FIELDS},
    "top": (*[${LIVE} && ^._id in schools[]._ref] | ${TOP_ORDER})[0...4]{ ${CARD_FIELDS} },
    "latest": *[
      ${LIVE} && ^._id in schools[]._ref
      && !(_id in ((*[${LIVE} && ^.^._id in schools[]._ref] | ${TOP_ORDER})[0...4]._id))
    ] | ${BY_DATE} [0...20]{ ${CARD_FIELDS} },
    "count": count(*[${LIVE} && ^._id in schools[]._ref]),
    "media": *[
      ${LIVE} && ^._id in schools[]._ref && contentType in ${MEDIA_TYPES}
      && !(_id in ((*[${LIVE} && ^.^._id in schools[]._ref] | ${TOP_ORDER})[0...4]._id))
    ] | ${BY_DATE} [0...4]{ ${CARD_FIELDS} }
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
    ogImageOverride { asset->{ _id, url } },
    "school": primarySchool->{ ${SCHOOL_REF_FIELDS} },
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
      ${LIVE} && _id != ^._id && primarySchool._ref == ^.primarySchool._ref
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
    "school": primarySchool->{ shortName, accentColor, "slug": slug.current },
    "authors": authors[]->{ name }
  }
`);

// Prerendered at build time (generateStaticParams). Older articles render on first request and are then cached.
export const ARTICLE_SLUGS_QUERY = defineQuery(`
  *[${LIVE}] | ${BY_DATE} [0...100] {
    "slug": slug.current,
    "school": primarySchool->slug.current
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
    "u": "/" + primarySchool->slug.current + "/" + slug.current,
    "s": primarySchool->shortName,
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
  "school": primarySchool->{ shortName, "slug": slug.current },
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
      "slug": slug.current,
      "school": primarySchool->slug.current,
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
      "school": primarySchool->{ "slug": slug.current, circleSpaceId },
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
    "school": primarySchool->shortName
  }
`);
