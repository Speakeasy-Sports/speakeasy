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

const PUBLISHED = /* groq */ `_type == "article" && status == "published" && defined(slug.current) && defined(primarySchool)`;

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
  *[${PUBLISHED}] | order(publishedAt desc) [0...20] { ${CARD_FIELDS} }
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
  *[${PUBLISHED} && $schoolId in schools[]._ref] | order(publishedAt desc) [0...20] { ${CARD_FIELDS} }
`);

export const ARTICLE_QUERY = defineQuery(`
  *[_type == "article" && slug.current == $slug && defined(primarySchool) && status != "draft"][0]{
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
      ${PUBLISHED} && _id != ^._id && primarySchool._ref == ^.primarySchool._ref
    ] | order(count((tags[]._ref)[@ in ^.^.tags[]._ref]) desc, publishedAt desc) [0...3] { ${CARD_FIELDS} },
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
  *[${PUBLISHED} && slug.current == $slug][0]{
    title,
    dek,
    contentType,
    "school": primarySchool->{ shortName, accentColor, "slug": slug.current },
    "authors": authors[]->{ name }
  }
`);

export const ARTICLE_SLUGS_QUERY = defineQuery(`
  *[${PUBLISHED}] | order(publishedAt desc) [0...200] {
    "slug": slug.current,
    "school": primarySchool->slug.current
  }
`);
