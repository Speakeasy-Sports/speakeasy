// Reading a Circle Email Hub form (Admin API v2 `GET /forms/{id}`) for the newsletter signup (AGENTS.md 7.4). Pure.
// Field elements carry `attributes.field_type`; the profile email is `contact_email`. Elements can nest (stacks).

export type FormElement = {
  id?: number | null;
  type?: string;
  attributes?: { field_type?: string; label?: string; required?: boolean; hidden?: boolean } | null;
  children?: FormElement[] | null;
};
export type CircleForm = { id?: number; status?: string; elements?: FormElement[] | null };

function flatten(elements: FormElement[] | null | undefined): FormElement[] {
  return (elements ?? []).flatMap((e) => [e, ...flatten(e.children)]);
}

/** The setup the site can submit to: published, with a profile email field and nothing else required. */
export type FormPlan = { ok: true; emailElementId: number } | { ok: false; reason: string };

export function planForm(form: CircleForm): FormPlan {
  if (form.status && form.status !== "published") return { ok: false, reason: `form is ${form.status}, not published` };
  const fields = flatten(form.elements).filter((e) => e.type === "field");
  const email = fields.find((e) => e.attributes?.field_type === "contact_email");
  if (typeof email?.id !== "number") return { ok: false, reason: "form has no profile email field" };
  const blocking = fields.filter((e) => e !== email && e.attributes?.required && !e.attributes?.hidden);
  if (blocking.length) {
    return { ok: false, reason: `other required fields: ${blocking.map((e) => e.attributes?.label ?? e.attributes?.field_type).join(", ")}` };
  }
  return { ok: true, emailElementId: email.id };
}
