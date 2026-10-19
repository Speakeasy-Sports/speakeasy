import type { Metadata } from "next";
import { absoluteUrl, DEFAULT_DESCRIPTION, SITE_NAME } from "./site";

type PageMeta = {
  title: string;
  description?: string | null;
  /** Site-relative canonical path, for example /georgia/some-story. */
  path: string;
  image?: { url: string; width?: number; height?: number; alt?: string } | null;
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

/**
 * Every page sets metadata through this helper (AGENTS.md section 14).
 * Title template is applied by the root layout; pass the bare page title here.
 */
export function buildMetadata(meta: PageMeta): Metadata {
  const description = meta.description?.trim() || DEFAULT_DESCRIPTION;
  const canonical = absoluteUrl(meta.path);
  const images = meta.image
    ? [{ url: meta.image.url, width: meta.image.width ?? 1200, height: meta.image.height ?? 630, alt: meta.image.alt ?? meta.title }]
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
