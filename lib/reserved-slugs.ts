// Top-level paths that are not valid school slugs (AGENTS.md section 6).
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
  "studio",
  "api",
  "feed.xml",
] as const;

export function isReservedSlug(slug: string): boolean {
  return (RESERVED_SLUGS as readonly string[]).includes(slug);
}
