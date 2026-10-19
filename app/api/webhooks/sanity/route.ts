import { after } from "next/server";
import { revalidateTag } from "next/cache";
import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { isDraftOrVersion, isReviewTransition, parsePayload, tagsForChange } from "@/lib/webhooks/sanity-payload";
import { finalizePublishedArticle } from "@/lib/webhooks/finalize-article";
import { finalizeDeps } from "@/lib/webhooks/deps";
import { notifyReview } from "@/lib/webhooks/notify-review";

// Sanity webhooks (AGENTS.md 7.1, 7.2, and section 5). Two webhooks post here; their filters and projection are in
// docs/setup.md. Revalidation happens before the response; status, Circle, and email run after it with `after`.

const log = (event: string, data: Record<string, unknown>) => console.log(JSON.stringify({ event, ...data }));

async function verified(req: Request, body: string): Promise<boolean> {
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  const signature = req.headers.get(SIGNATURE_HEADER_NAME);
  if (!secret || !signature) return false;
  try {
    return await isValidSignature(body, signature, secret);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!process.env.SANITY_WEBHOOK_SECRET) return Response.json({ error: "Webhook secret not configured" }, { status: 500 });
  const body = await req.text();
  if (!(await verified(req, body))) return Response.json({ error: "Invalid signature" }, { status: 401 });

  let payload;
  try {
    payload = parsePayload(JSON.parse(body));
  } catch {
    payload = null;
  }
  if (!payload) return Response.json({ error: "Unrecognized payload" }, { status: 400 });

  // Drafts and versions come only from the review webhook. They are not live, so nothing to revalidate.
  if (isDraftOrVersion(payload._id)) {
    const review = isReviewTransition(payload);
    if (review) {
      const id = payload._id;
      after(() => notifyReview(id).catch((err) => log("review_notify_failed", { id, error: String(err) })));
    }
    return Response.json({ ok: true, review });
  }

  const tags = tagsForChange(payload);
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  log("sanity_webhook", { id: payload._id, type: payload._type, operation: payload.operation, tags });

  if (payload._type === "article" && payload.operation !== "delete") {
    const { _id: id, textChanged } = payload;
    after(() =>
      finalizePublishedArticle(id, { textChanged }, finalizeDeps("webhooks/sanity")).catch((err) => log("article_finalize_failed", { id, error: String(err) })),
    );
  }

  return Response.json({ ok: true, revalidated: tags });
}
