import { Feed } from "feed";
import type { FEED_QUERY_RESULT } from "@/sanity.types";
import { absoluteUrl, articlePath, SITE_NAME, SITE_URL } from "@/lib/seo";

type Item = FEED_QUERY_RESULT[number];

/** RSS 2.0 with dek and link only, never full text (AGENTS.md section 6). */
export function buildFeed(opts: { title: string; description: string; path: string; feedPath: string; items: Item[] }): string {
  const newest = opts.items[0]?.published;
  const feed = new Feed({
    title: opts.title,
    description: opts.description,
    id: absoluteUrl(opts.path),
    link: absoluteUrl(opts.path),
    language: "en-US",
    favicon: absoluteUrl("/icon.svg"),
    copyright: `© ${new Date().getFullYear()} ${SITE_NAME}`,
    updated: newest ? new Date(newest) : new Date(),
    feedLinks: { rss: absoluteUrl(opts.feedPath) },
    generator: SITE_URL,
  });

  for (const i of opts.items) {
    if (!i.slug || !i.school?.slug || !i.title || !i.published) continue;
    const url = absoluteUrl(articlePath(i.school.slug, i.slug));
    feed.addItem({
      title: i.title,
      id: url,
      link: url,
      description: i.dek ?? undefined,
      date: new Date(i.published),
      author: (i.authors ?? []).filter((n): n is string => Boolean(n)).map((name) => ({ name })),
      category: [i.school.shortName, ...(i.tags ?? [])].filter((n): n is string => Boolean(n)).map((name) => ({ name })),
      image: i.image ? `${i.image}?w=1200&h=675&fit=crop&auto=format` : undefined,
    });
  }
  return feed.rss2();
}

export const FEED_HEADERS = {
  "Content-Type": "application/rss+xml; charset=utf-8",
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
};
