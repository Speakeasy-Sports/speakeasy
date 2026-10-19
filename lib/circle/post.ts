// What the site sends to Circle for an article (AGENTS.md 7.2): title, dek, a link to the story, the hero image.
// Never the article body. Pure, unit tested; the wire format lives in lib/circle/admin.ts.
import { absoluteUrl, articlePath } from "@/lib/seo";

export type CirclePostContent = { spaceId: string; title: string; dek: string; url: string; imageUrl: string | null };

export type SyncableArticle = {
  _id: string;
  title: string | null;
  dek: string | null;
  slug: string | null;
  circlePostId: string | null;
  school: { slug: string | null; circleSpaceId: string | null } | null;
  heroImageUrl: string | null;
};

/** Returns the post content, or the reason the article cannot be posted yet. */
export function buildPostContent(a: SyncableArticle): CirclePostContent | { error: string } {
  if (!a.school?.circleSpaceId) return { error: "Primary school has no Circle space id" };
  if (!a.school.slug || !a.slug) return { error: "Article or primary school has no slug" };
  if (!a.title) return { error: "Article has no title" };
  return {
    spaceId: a.school.circleSpaceId,
    title: a.title,
    dek: a.dek ?? "",
    url: absoluteUrl(articlePath(a.school.slug, a.slug)),
    imageUrl: a.heroImageUrl ? `${a.heroImageUrl}?w=1200&h=630&fit=crop&auto=format` : null,
  };
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Post body as simple HTML: the dek, then the link. */
export function postBodyHtml(c: CirclePostContent): string {
  const link = `<a href="${escapeHtml(c.url)}">${escapeHtml(c.url)}</a>`;
  return `${c.dek ? `<p>${escapeHtml(c.dek)}</p>` : ""}<p>Read the full story: ${link}</p>`;
}
