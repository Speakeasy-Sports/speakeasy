import type { Metadata } from "next";
import { urlFor } from "@/lib/sanity/image";
import { absoluteUrl, DEFAULT_DESCRIPTION, SITE_NAME } from "./site";

type ShareImage = { url: string; width?: number; height?: number; alt?: string };

type PageMeta = {
  title: string;
  description?: string | null;
  /** Site-relative canonical path, for example /georgia/some-story. */
  path: string;
  image?: ShareImage | null;
  /** Used when `image` is empty: the default share image from Site settings (see defaultOgImage). */
  fallbackImage?: ShareImage | null;
  type?: "website" | "article";
  noIndex?: boolean | null;
  article?: {
    publishedTime?: string | null;
    modifiedTime?: string | null;
    authors?: string[];
    section?: string | null;
    tags?: string[];
  };
  /** A school's own RSS feed, advertised next to the site feed. */
  schoolFeed?: { path: string; title: string } | null;
  /** Use the title as-is instead of the "%s | Speakeasy Sports" template (the home page). */
  absoluteTitle?: boolean;
};

type SettingsImage = {
  defaultOgImage?: { asset?: { _id?: string | null } | null; alt?: string | null } | null;
} | null;

/** Site settings' default share image at 1200x630, or null when none is set. */
export function defaultOgImage(settings: SettingsImage | undefined): ShareImage | null {
  const img = settings?.defaultOgImage;
  if (!img?.asset?._id) return null;
  return {
    url: urlFor({ asset: { _ref: img.asset._id } }).width(1200).height(630).fit("crop").url(),
    width: 1200,
    height: 630,
    alt: img.alt ?? undefined,
  };
}

/**
 * Every page sets metadata through this helper (AGENTS.md section 14).
 * Title template is applied by the root layout; pass the bare page title here.
 */
export function buildMetadata(meta: PageMeta): Metadata {
  const description = meta.description?.trim() || DEFAULT_DESCRIPTION;
  const canonical = absoluteUrl(meta.path);
  const image = meta.image ?? meta.fallbackImage;
  const images = image
    ? [{ url: image.url, width: image.width ?? 1200, height: image.height ?? 630, alt: image.alt ?? meta.title }]
    : undefined;

  const feeds = [{ url: absoluteUrl("/feed.xml"), title: SITE_NAME }];
  if (meta.schoolFeed) feeds.push({ url: absoluteUrl(meta.schoolFeed.path), title: meta.schoolFeed.title });

  return {
    title: meta.absoluteTitle ? { absolute: meta.title } : meta.title,
    description,
    alternates: { canonical, types: { "application/rss+xml": feeds } },
    robots: meta.noIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: meta.type ?? "website",
      siteName: SITE_NAME,
      title: meta.title,
      description,
      url: canonical,
      images,
      locale: "en_US",
      ...(meta.type === "article" && meta.article
        ? {
            publishedTime: meta.article.publishedTime ?? undefined,
            modifiedTime: meta.article.modifiedTime ?? undefined,
            authors: meta.article.authors,
            section: meta.article.section ?? undefined,
            tags: meta.article.tags,
          }
        : {}),
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: meta.title,
      description,
      images: images?.map((i) => i.url),
    },
  };
}
