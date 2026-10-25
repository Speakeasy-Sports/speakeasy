/**
 * Search titles and descriptions for the site-wide index pages, from Site settings > SEO.
 * Articles, schools, authors, tags, and info pages carry their own SEO fields; these pages have no document of their own.
 */
export const PAGE_SEO_PAGES = [
  { name: "home", title: "Home page" },
  { name: "podcasts", title: "Podcasts" },
  { name: "videos", title: "Videos" },
  { name: "newsletter", title: "Newsletter" },
  { name: "search", title: "Search" },
  { name: "national", title: "National front" },
  { name: "community", title: "Community" },
] as const;

export type PageSeoKey = (typeof PAGE_SEO_PAGES)[number]["name"];
type RawPageSeo = { title?: string | null; description?: string | null } | null | undefined;
export type RawSeo = Partial<Record<PageSeoKey, RawPageSeo>> | null | undefined;

/** The editor's title and description for a page, each null when the Studio field is empty. */
export function pageSeo(raw: RawSeo, page: PageSeoKey): { title: string | null; description: string | null } {
  const entry = raw?.[page];
  return { title: entry?.title?.trim() || null, description: entry?.description?.trim() || null };
}
