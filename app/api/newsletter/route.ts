import { CircleApiError, circleForms, newsletterConfigured } from "@/lib/circle/admin";
import { NEWSLETTER_ROUTE, emailElementId, resetFormCache } from "@/lib/circle/newsletter";
import { withinLimit } from "@/lib/kv/rate-limit";

// Newsletter signup (AGENTS.md 7.4): a submission to the Circle Email Hub form, which subscribes the contact to
// marketing email. Verified against the Admin API v2 Swagger (docs/circle-api-notes.md, V3).
const log = (event: string, data: Record<string, unknown> = {}) => console.log(JSON.stringify({ event, ...data }));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PER_HOUR = 10;

const unavailable = () => Response.json({ error: "Signups open soon. Try again in a day or two." }, { status: 503 });

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await req.json();
    body = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (body.website) {
    log("newsletter_dropped", { reason: "honeypot" });
    return Response.json({ ok: true });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) return Response.json({ error: "Check your email address." }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await withinLimit(`newsletter:${ip}`, PER_HOUR, 3600))) {
    return Response.json({ error: "Too many signups from here. Try again in an hour." }, { status: 429 });
  }

  if (!newsletterConfigured()) {
    log("newsletter_not_configured", { reason: "CIRCLE_ADMIN_API_TOKEN or CIRCLE_NEWSLETTER_FORM_ID not set" });
    return unavailable();
  }
  const formId = process.env.CIRCLE_NEWSLETTER_FORM_ID!;

  try {
    const elementId = await emailElementId(formId);
    if (elementId === null) return unavailable();
    await circleForms.submit(formId, [{ id: elementId, value: email }], NEWSLETTER_ROUTE);
  } catch (err) {
    if (err instanceof CircleApiError && err.status === 422) {
      // Circle rejects addresses it considers invalid; a changed form also lands here, so re-read it next time.
      resetFormCache();
      log("newsletter_rejected", { error: err.message });
      return Response.json({ error: "Check your email address." }, { status: 400 });
    }
    if (err instanceof CircleApiError && (err.status === 401 || err.status === 403 || err.status === 404)) {
      // 401 with "You cannot perform this action" is Email Hub switched off; 404 is a wrong form id.
      log("newsletter_circle_setup", { status: err.status, error: err.message });
      return unavailable();
    }
    log("newsletter_failed", { error: String(err) });
    return Response.json({ error: "That did not go through. Try again in a moment." }, { status: 502 });
  }

  log("newsletter_signup");
  return Response.json({ ok: true });
}
