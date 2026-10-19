import { extractIds, secretMatches } from "@/lib/webhooks/circle-payload";
import { refreshCommentCount } from "@/lib/webhooks/comment-count";
import { countDeps } from "@/lib/webhooks/deps";
import { circleSyncEnabled } from "@/lib/circle/admin";

// Circle Workflow webhook, "comment created" and "post updated" (AGENTS.md 7.3). Setup in docs/setup.md section 6.
const log = (event: string, data: Record<string, unknown>) => console.log(JSON.stringify({ event, ...data }));

export async function POST(req: Request) {
  if (!process.env.CIRCLE_WEBHOOK_SECRET) return Response.json({ error: "Webhook secret not configured" }, { status: 500 });
  if (!secretMatches(req, process.env.CIRCLE_WEBHOOK_SECRET)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const text = await req.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  const ids = extractIds(body, new URL(req.url).searchParams);
  if (!ids.postId && !ids.commentId) {
    // Logged so the first live event shows what the Workflow actually sends.
    log("circle_webhook_unrecognized", { keys: body && typeof body === "object" ? Object.keys(body) : typeof body });
    return Response.json({ error: "No post or comment id in payload" }, { status: 400 });
  }
  // Same switch as the post sync: no Admin API calls until Circle is set up.
  if (!circleSyncEnabled()) return Response.json({ ok: true, status: "disabled" });

  const result = await refreshCommentCount(ids, countDeps("webhooks/circle"));
  return Response.json({ ok: true, ...result });
}
