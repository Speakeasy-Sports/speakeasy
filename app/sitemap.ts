import type { MetadataRoute } from "next";
import { client } from "@/lib/sanity/client";
import { SITEMAP_QUERY } from "@/lib/sanity/queries";
import { tags } from "@/lib/sanity/tags";
import { absoluteUrl, articlePath, authorPath, schoolPath, tagPath } from "@/lib/seo";

export const revalidate = 3600;

// Articles, schools, authors, tags, and standing pages; noIndex articles excluded (AGENTS.md section 6).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await client.fetch(
    SITEMAP_QUERY,
    {},
    { next: { revalidate: 3600, tags: [tags.articles, tags.schools, tags.authors, tags.taxonomy, tags.pages] } },
  );
  const date = (d: string | null) => (d ? new Date(d) : undefined);

  return [
    { url: absoluteUrl("/"), changeFrequency: "hourly", priority: 1 },
    ...data.schools
      .filter((s) => s.slug)
      .map((s) => ({ url: absoluteUrl(schoolPath(s.slug!)), lastModified: date(s.updated), changeFrequency: "hourly" as const, priority: 0.9 })),
    ...data.articles
      .filter((a) => a.slug && a.school)
      .map((a) => ({ url: absoluteUrl(articlePath(a.school!, a.slug!)), lastModified: date(a.updated), priority: 0.8 })),
    { url: absoluteUrl("/podcasts"), changeFrequency: "daily", priority: 0.6 },
    { url: absoluteUrl("/videos"), changeFrequency: "daily", priority: 0.6 },
    { url: absoluteUrl("/newsletter"), priority: 0.5 },
    ...data.authors.filter((a) => a.slug).map((a) => ({ url: absoluteUrl(authorPath(a.slug!)), lastModified: date(a.updated), priority: 0.4 })),
    ...data.tags.filter((t) => t.slug).map((t) => ({ url: absoluteUrl(tagPath(t.slug!)), lastModified: date(t.updated), priority: 0.4 })),
    ...data.pages.filter((p) => p.slug).map((p) => ({ url: absoluteUrl(`/${p.slug}`), lastModified: date(p.updated), priority: 0.2 })),
  ];
}
