import "server-only";
import { circleForms } from "./admin";
import { planForm } from "./form";

// Newsletter signups go through the Email Hub form (AGENTS.md 7.4). The form's field ids change only when someone
// edits it in Circle, so the layout is read once per instance per 10 minutes rather than on every signup.
export const NEWSLETTER_ROUTE = "api/newsletter";
const PLAN_TTL_MS = 10 * 60 * 1000;

let cached: { formId: string; emailElementId: number; at: number } | null = null;

/** The form's profile email element, or null (logged) when the form cannot take a signup from the site. */
export async function emailElementId(formId: string): Promise<number | null> {
  if (cached && cached.formId === formId && Date.now() - cached.at < PLAN_TTL_MS) return cached.emailElementId;
  const plan = planForm(await circleForms.get(formId, NEWSLETTER_ROUTE));
  if (!plan.ok) {
    console.log(JSON.stringify({ event: "newsletter_form_unusable", formId, reason: plan.reason }));
    return null;
  }
  cached = { formId, emailElementId: plan.emailElementId, at: Date.now() };
  return plan.emailElementId;
}

/** Forget the cached layout, after Circle rejects a submission or in tests. */
export function resetFormCache(): void {
  cached = null;
}
