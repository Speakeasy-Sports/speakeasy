import { defineQuery } from "next-sanity";

// One GROQ query per page, typed with Sanity TypeGen (pnpm typegen regenerates sanity.types.ts).
// Fragments are plain strings so they stay inline for TypeGen.

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

const AUTHOR_REF_FIELDS = /* groq */ `
  _id,
  name,
  "slug": slug.current,
  role,
  bio,
  photo { asset->{ _id, url, metadata { lqip } }, hotspot, crop, alt },
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
  "authors": authors[]->{ _id, name, "slug": slug.current },
  heroImage { ${IMAGE_FIELDS} },
  heroEmbed { provider, url, title }
`;

// What counts as live: any article in the published perspective with a slug and a primary school.
// Site queries never filter on `status`. It is a Studio workflow field; Sanity's publish action (immediate or scheduled)
// is the only thing that moves a document into the published perspective, and draft mode reads the drafts perspective
// so editors can preview any status. Filtering on status here is what broke preview and hid freshly published stories.
const LIVE = /* groq */ `_type == "article" && defined(slug.current) && defined(primarySchool)`;
const BY_DATE = /* groq */ `order(coalesce(publishedAt, _createdAt) desc)`;

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
    "navSchools": navSchools[]->{ ${SCHOOL_REF_FIELDS} }
  }
`);

export const HOME_LATEST_QUERY = defineQuery(`
  *[${LIVE}] | ${BY_DATE} [0...20] { ${CARD_FIELDS} }
`);

export const SCHOOL_SLUGS_QUERY = defineQuery(`
  *[_type == "school" && defined(slug.current)]{ "slug": slug.current }
`);

export const SCHOOL_QUERY = defineQuery(`
  *[_type == "school" && slug.current == $slug][0]{
    ${SCHOOL_REF_FIELDS},
    mascot,
    description,
    seoTitle,
    seoDescription,
    logo { asset->{ _id, url }, alt },
    heroImage { asset->{ _id, url, metadata { lqip } }, hotspot, crop }
  }
`);

export const SCHOOL_LATEST_QUERY = defineQuery(`
  *[${LIVE} && $schoolId in schools[]._ref] | ${BY_DATE} [0...20] { ${CARD_FIELDS} }
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
