import "server-only";
import { getWriteClient } from "@/lib/sanity/write-client";
import { REVIEW_NOTIFY_QUERY } from "@/lib/sanity/queries";
import { postmarkConfigured, sendEmail } from "@/lib/email/postmark";
import { buildReviewEmail } from "@/lib/email/review";
import { SITE_URL } from "@/lib/seo";

/** Emails the editor when a draft moves into review (AGENTS.md section 5, Phase 1 version). */
export async function notifyReview(draftId: string): Promise<void> {
  const to = process.env.EDITOR_NOTIFY_EMAIL;
  if (!to || !postmarkConfigured()) {
    console.warn(JSON.stringify({ event: "review_notify_skipped", id: draftId, reason: "Postmark or EDITOR_NOTIFY_EMAIL not set" }));
    return;
  }
  const a = await getWriteClient().fetch(REVIEW_NOTIFY_QUERY, { id: draftId });
  if (!a) return;
  const publishedId = draftId.replace(/^(drafts|versions\.[^.]+)\./, "");
  await sendEmail(buildReviewEmail(to, SITE_URL, { id: publishedId, title: a.title, dek: a.dek, authors: a.authors, school: a.school }));
  console.log(JSON.stringify({ event: "review_notified", id: draftId }));
}
