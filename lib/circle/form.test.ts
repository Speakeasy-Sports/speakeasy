import { describe, expect, it } from "vitest";
import { planForm } from "./form";

const email = { id: 124, type: "field", attributes: { field_type: "contact_email", label: "Email", required: true } };
const name = { id: 123, type: "field", attributes: { field_type: "contact_name", label: "Name", required: false } };

describe("planForm", () => {
  it("finds the profile email field, including inside a stack", () => {
    expect(planForm({ status: "published", elements: [{ id: 1, type: "text" }, name, email] })).toEqual({ ok: true, emailElementId: 124 });
    expect(planForm({ status: "published", elements: [{ id: 9, type: "layout", children: [email] }] })).toEqual({ ok: true, emailElementId: 124 });
  });
  it("refuses forms the site cannot fill in", () => {
    expect(planForm({ status: "draft", elements: [email] })).toMatchObject({ ok: false, reason: "form is draft, not published" });
    expect(planForm({ status: "published", elements: [name] })).toMatchObject({ ok: false, reason: "form has no profile email field" });
    const requiredName = { ...name, attributes: { ...name.attributes, required: true } };
    expect(planForm({ status: "published", elements: [requiredName, email] })).toMatchObject({ ok: false, reason: "other required fields: Name" });
  });
});
