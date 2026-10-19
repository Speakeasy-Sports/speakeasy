import { absoluteUrl, SITE_NAME, SITE_URL } from "./site";

type Person = { name: string; url?: string };

export type NewsArticleInput = {
  headline: string;
  description: string;
  url: string;
  imageUrls: string[];
  datePublished?: string | null;
  dateModified?: string | null;
  authors: Person[];
  section?: string | null;
  keywords?: string[];
  isAccessibleForFree?: boolean;
};

export function newsArticleJsonLd(input: NewsArticleInput) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
    headline: input.headline,
    description: input.description,
    image: input.imageUrls,
    datePublished: input.datePublished ?? undefined,
    dateModified: input.dateModified ?? input.datePublished ?? undefined,
    author: input.authors.map((a) => ({ "@type": "Person", name: a.name, url: a.url })),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg") },
    },
    articleSection: input.section ?? undefined,
    keywords: input.keywords?.length ? input.keywords.join(", ") : undefined,
    isAccessibleForFree: input.isAccessibleForFree ?? true,
  };
}

export type Crumb = { name: string; path: string };

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

/** Serialize for a <script type="application/ld+json">. Escapes "<" so content cannot close the tag. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
