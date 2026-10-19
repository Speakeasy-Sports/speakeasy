// The editor notification sent when a contributor moves a draft into review (AGENTS.md section 5). Pure, unit tested.
import type { Email } from "./postmark";

export type ReviewArticle = { id: string; title: string | null; dek: string | null; authors: Array<string | null> | null; school: string | null };

export function studioEditUrl(siteUrl: string, id: string): string {
  return `${siteUrl}/studio/intent/edit/id=${encodeURIComponent(id)};type=article`;
}

export function buildReviewEmail(to: string, siteUrl: string, a: ReviewArticle): Email {
  const title = a.title?.trim() || "Untitled story";
  const authors = (a.authors ?? []).filter(Boolean).join(", ");
  const details = [authors && `By: ${authors}`, a.school && `School: ${a.school}`, a.dek && `Dek: ${a.dek}`].filter(
    (l): l is string => !!l,
  );
  const lines = [`"${title}" is ready for review.`, ...(details.length ? ["", ...details] : []), "", `Open in the Studio: ${studioEditUrl(siteUrl, a.id)}`];
  return { to, subject: `Ready for review: ${title}`, text: lines.join("\n") };
}
