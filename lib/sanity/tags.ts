/**
 * Cache tag vocabulary shared by page fetches and the Sanity webhook handler (AGENTS.md 7.1).
 *
 * Pages tag fetches with what they depend on. The webhook (week 2) revalidates:
 *   article:{id}, article-slug:{slug}, articles   on any article change
 *   school:{slug}, schools                         on any school change
 *   author:{slug}, tag:{slug}                      on author or tag change
 *   settings                                       on siteSettings change
 *   sponsors                                       on sponsorSlot change
 *   home                                           on any of the above that affects the front page
 */
export const tags = {
  home: "home",
  articles: "articles",
  schools: "schools",
  settings: "settings",
  sponsors: "sponsors",
  article: (id: string) => `article:${id}`,
  articleSlug: (slug: string) => `article-slug:${slug}`,
  school: (slug: string) => `school:${slug}`,
  author: (slug: string) => `author:${slug}`,
  tag: (slug: string) => `tag:${slug}`,
} as const;
