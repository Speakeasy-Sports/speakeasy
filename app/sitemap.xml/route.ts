import { client } from "@/lib/sanity/client";
import { SITEMAP_QUERY } from "@/lib/sanity/queries";
import { tags } from "@/lib/sanity/tags";
import { sitemapXml, type SitemapEntry } from "@/lib/sitemap";
import { absoluteUrl, authorPath, NATIONAL_SLUG, schoolPath, tagPath } from "@/lib/seo";

// Articles, schools, authors, tags, and standing pages; noIndex articles excluded (AGENTS.md section 6).
// A route handler rather than app/sitemap.ts; see lib/sitemap.ts for why.
export const revalidate = 300;

export async function GET() {
  const data = await client.fetch(
    SITEMAP_QUERY,
    {},
    { next: { revalidate: 300, tags: [tags.articles, tags.schools, tags.authors, tags.taxonomy, tags.pages] } },
  );

  const entries: SitemapEntry[] = [
    { url: absoluteUrl("/"), changeFrequency: "hourly", priority: 1 },
    ...data.schools
      .filter((s) => s.slug)
      .map((s) => ({ url: absoluteUrl(schoolPath(s.slug!)), lastModified: s.updated, changeFrequency: "hourly" as const, priority: 0.9 })),
    { url: absoluteUrl(`/${NATIONAL_SLUG}`), changeFrequency: "hourly", priority: 0.9 },
    ...data.articles.filter((a) => a.path).map((a) => ({ url: absoluteUrl(a.path!), lastModified: a.updated, priority: 0.8 })),
    { url: absoluteUrl("/podcasts"), changeFrequency: "daily", priority: 0.6 },
    { url: absoluteUrl("/videos"), changeFrequency: "daily", priority: 0.6 },
    { url: absoluteUrl("/newsletter"), priority: 0.5 },
    { url: absoluteUrl("/community"), priority: 0.5 },
    ...data.authors.filter((a) => a.slug).map((a) => ({ url: absoluteUrl(authorPath(a.slug!)), lastModified: a.updated, priority: 0.4 })),
    ...data.tags.filter((t) => t.slug).map((t) => ({ url: absoluteUrl(tagPath(t.slug!)), lastModified: t.updated, priority: 0.4 })),
    ...data.pages.filter((p) => p.slug).map((p) => ({ url: absoluteUrl(`/${p.slug}`), lastModified: p.updated, priority: 0.2 })),
  ];

  return new Response(sitemapXml(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
