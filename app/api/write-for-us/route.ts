import { buildApplicationEmail, parseApplication } from "@/lib/email/application";
import { postmarkConfigured, sendEmail } from "@/lib/email/postmark";
import { withinLimit } from "@/lib/kv/rate-limit";

// Write for us applications (AGENTS.md 7.9). Emails the editor through Postmark; nothing is stored.
const log = (event: string, data: Record<string, unknown> = {}) => console.log(JSON.stringify({ event, ...data }));

/** Faster than this from page load to submit is a script, not a person. */
const MIN_FILL_MS = 3000;
const PER_HOUR = 5;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await req.json();
    body = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  // Bots get the same success response a person does, so there is nothing to tune against.
  const elapsed = typeof body.elapsed === "number" ? body.elapsed : 0;
  if (body.website || elapsed < MIN_FILL_MS) {
    log("application_dropped", { reason: body.website ? "honeypot" : "too_fast" });
    return Response.json({ ok: true });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await withinLimit(`apply:${ip}`, PER_HOUR, 3600))) {
    return Response.json({ error: "Too many applications from here. Try again in an hour." }, { status: 429 });
  }

  const result = parseApplication(body);
  if (!result.ok) return Response.json({ error: result.message, field: result.field }, { status: 400 });

  const to = process.env.EDITOR_NOTIFY_EMAIL;
  if (!postmarkConfigured() || !to) {
    log("application_not_sent", { reason: "Postmark or EDITOR_NOTIFY_EMAIL not set" });
    return Response.json({ error: "Applications are not open yet. Try again soon." }, { status: 503 });
  }

  try {
    await sendEmail(buildApplicationEmail(to, result.value));
  } catch (err) {
    log("application_send_failed", { error: String(err) });
    return Response.json({ error: "That did not go through. Try again in a moment." }, { status: 502 });
  }
  log("application_sent");
  return Response.json({ ok: true });
}
