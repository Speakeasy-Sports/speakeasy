import { circleSyncEnabled } from "@/lib/circle/admin";
import { getWriteClient } from "@/lib/sanity/write-client";
import { CIRCLE_DAILY_QUERY } from "@/lib/sanity/queries";
import { weeklyCircleUsage } from "@/lib/kv/usage";
import { runDaily } from "@/lib/webhooks/daily";
import { refreshCommentCount } from "@/lib/webhooks/comment-count";
import { finalizePublishedArticle } from "@/lib/webhooks/finalize-article";
import { countDeps, finalizeDeps } from "@/lib/webhooks/deps";

// Vercel Cron, daily (vercel.json). Vercel sends "Authorization: Bearer $CRON_SECRET".
export const maxDuration = 300;

const log = (event: string, data: Record<string, unknown>) => console.log(JSON.stringify({ event, ...data }));

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const enabled = circleSyncEnabled();
  const summary = await runDaily(new Date(), {
    circleEnabled: enabled,
    candidates: (postSince, countSince) => getWriteClient().fetch(CIRCLE_DAILY_QUERY, { postSince, countSince }),
    finalize: (id) => finalizePublishedArticle(id, { textChanged: false, retry: true }, finalizeDeps("cron/circle-daily")),
    refreshCount: (postId) => refreshCommentCount({ postId, commentId: null }, countDeps("cron/circle-daily")),
    weeklyUsage: () => weeklyCircleUsage(new Date()),
    log,
  });
  return Response.json({ ok: true, ...summary });
}
