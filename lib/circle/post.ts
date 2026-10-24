// What the site sends to Circle for an article (AGENTS.md 7.2): title, dek, a link to the story, the hero image.
// Never the article body. Pure, unit tested; the wire format lives in lib/circle/admin.ts.
import { absoluteUrl, articlePath } from "@/lib/seo";

export type CirclePostContent = { spaceId: string; title: string; dek: string; url: string; imageUrl: string | null };

export type SyncableArticle = {
  _id: string;
  title: string | null;
  dek: string | null;
  slug: string | null;
  /** "national" stories never get a Circle post (docs/specs/phase-1-ux-update.md, 3.5). */
  scope?: string | null;
  circlePostId: string | null;
  school: { slug: string | null; circleSpaceId: string | null } | null;
  heroImageUrl: string | null;
};

export const NATIONAL_NO_POST = "National stories are not posted to Circle";
/** Recorded when a story that already has a Circle post becomes national. The post stays; nothing else is called. */
export const NATIONAL_KEEPS_POST = "Scope changed to national; existing Circle post left in place";

/** Returns the post content, or the reason the article cannot be posted yet. */
export function buildPostContent(a: SyncableArticle): CirclePostContent | { error: string } {
  if (a.scope === "national") return { error: NATIONAL_NO_POST };
  if (!a.school?.circleSpaceId) return { error: "Primary school has no Circle space id" };
  if (!a.school.slug || !a.slug) return { error: "Article or primary school has no slug" };
  if (!a.title) return { error: "Article has no title" };
  return {
    spaceId: a.school.circleSpaceId,
    title: a.title,
    dek: a.dek ?? "",
    url: absoluteUrl(articlePath(a.school.slug, a.slug)),
    // JPEG at a fixed size: Circle stores the file as uploaded, so it gets a cover-sized image, not the original.
    imageUrl: a.heroImageUrl ? `${a.heroImageUrl}?w=1200&h=630&fit=crop&fm=jpg&q=80` : null,
  };
}

type TipTapText = { type: "text"; text: string; marks?: Array<{ type: "link"; attrs: { href: string; target: string } }> };
export type TipTapDoc = { type: "doc"; content: Array<{ type: "paragraph"; content: TipTapText[] }> };

/** Post body as TipTap JSON (Admin API v2 `tiptap_body.body`): the dek, then the link. Links need href and target. */
export function postBodyDoc(c: CirclePostContent): TipTapDoc {
  const link: TipTapText = { type: "text", text: c.url, marks: [{ type: "link", attrs: { href: c.url, target: "_blank" } }] };
  return {
    type: "doc",
    content: [
      ...(c.dek ? [{ type: "paragraph" as const, content: [{ type: "text" as const, text: c.dek }] }] : []),
      { type: "paragraph", content: [{ type: "text", text: "Read the full story: " }, link] },
    ],
  };
}
