/**
 * Cache tag vocabulary shared by page fetches and the webhook handlers (AGENTS.md 7.1, 7.3).
 *
 * A page can only tag what it knows before the fetch, which is the slug in the URL, never the document id.
 * So pages tag by slug and collection, and handlers revalidate by slug and collection:
 *
 *   article page    article-slug:{slug}, school:{school}, articles, sponsors
 *   school page     school:{slug}, schools, articles
 *   home            home, articles
 *   settings        settings, schools
 *   og image        article-slug:{slug}
 *
 *   Sanity webhook, article changed   -> article-slug:{slug}, articles, home
 *   Sanity webhook, school changed    -> school:{slug}, schools, articles, home
 *   Sanity webhook, author or tag     -> articles  (author and tag pages add author:{slug}, tag:{slug} in week 2)
 *   Sanity webhook, siteSettings      -> settings
 *   Sanity webhook, sponsorSlot       -> sponsors
 *   Circle webhook, comment count     -> article-slug:{slug}  (the handler finds the article by circlePostId)
 *
 * `articles` is deliberately broad: at 10 to 12 posts a week, clearing every article page on any article change
 * costs nothing and keeps related stories and the Latest lists honest.
 */
export const tags = {
  home: "home",
  articles: "articles",
  schools: "schools",
  settings: "settings",
  sponsors: "sponsors",
  articleSlug: (slug: string) => `article-slug:${slug}`,
  school: (slug: string) => `school:${slug}`,
  author: (slug: string) => `author:${slug}`,
  tag: (slug: string) => `tag:${slug}`,
} as const;

export function articlePageTags(slug: string, schoolSlug: string): string[] {
  return [tags.articleSlug(slug), tags.school(schoolSlug), tags.articles, tags.sponsors];
}

export function schoolPageTags(schoolSlug: string): string[] {
  return [tags.school(schoolSlug), tags.schools, tags.articles];
}
