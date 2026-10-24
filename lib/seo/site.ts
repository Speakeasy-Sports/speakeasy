export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://speakeasysports.com").replace(/\/$/, "");
export const SITE_NAME = "Speakeasy Sports";
export const DEFAULT_DESCRIPTION = "College sports coverage and community, built for fans.";

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const NATIONAL_SLUG = "national";

export function articlePath(schoolSlug: string, slug: string): string {
  return `/${schoolSlug}/${slug}`;
}

/** National stories live at /national/{slug}; they have no primary school. */
export function nationalArticlePath(slug: string): string {
  return `/${NATIONAL_SLUG}/${slug}`;
}

/** The canonical path for either scope. A school story without a school has no URL. */
export function storyPath(a: { scope?: string | null; slug?: string | null; school?: { slug?: string | null } | null }): string | null {
  if (!a.slug) return null;
  if (a.scope === "national") return nationalArticlePath(a.slug);
  return a.school?.slug ? articlePath(a.school.slug, a.slug) : null;
}

export function schoolPath(schoolSlug: string): string {
  return `/${schoolSlug}`;
}

export function authorPath(slug: string): string {
  return `/authors/${slug}`;
}

export function tagPath(slug: string): string {
  return `/tags/${slug}`;
}

export function ogImageUrl(slug: string): string {
  return absoluteUrl(`/api/og?slug=${encodeURIComponent(slug)}`);
}
