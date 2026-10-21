// Top-level paths that are not valid school slugs (AGENTS.md section 6), plus paths the site itself serves.
export const RESERVED_SLUGS = [
  "authors",
  "tags",
  "podcasts",
  "videos",
  "search",
  "newsletter",
  "about",
  "contact",
  "terms",
  "privacy",
  "write-for-us",
  "studio",
  "api",
  "feed.xml",
  // Internal targets of the ?page= rewrites in next.config.ts, and generated files.
  "latest",
  "all", // the "no school filter" value in internal filter paths
  "search-index.json",
  "sitemap.xml",
  "robots.txt",
] as const;

export function isReservedSlug(slug: string): boolean {
  return (RESERVED_SLUGS as readonly string[]).includes(slug);
}
