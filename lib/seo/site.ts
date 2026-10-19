export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://speakeasysports.com").replace(/\/$/, "");
export const SITE_NAME = "Speakeasy Sports";
export const DEFAULT_DESCRIPTION = "College sports coverage and community, built for fans.";

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function articlePath(schoolSlug: string, slug: string): string {
  return `/${schoolSlug}/${slug}`;
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
