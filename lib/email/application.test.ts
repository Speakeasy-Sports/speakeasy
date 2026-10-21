import { describe, expect, it } from "vitest";
import { buildApplicationEmail, parseApplication } from "./application";

const base = { name: " Sam ", email: "sam@example.com", cover: "Recruiting", sample1: "https://example.com/a", adult: true };

describe("parseApplication", () => {
  it("trims and keeps optional fields empty as null", () => {
    expect(parseApplication(base)).toEqual({
      ok: true,
      value: { name: "Sam", email: "sam@example.com", cover: "Recruiting", samples: ["https://example.com/a"], social: null, worth: null },
    });
  });
  it("names the first failing field", () => {
    expect(parseApplication({ ...base, email: "nope" })).toMatchObject({ ok: false, field: "email" });
    expect(parseApplication({ ...base, sample1: "" })).toMatchObject({ ok: false, field: "sample1" });
    expect(parseApplication({ ...base, sample1: "javascript:alert(1)" })).toMatchObject({ ok: false, field: "sample1" });
    expect(parseApplication({ ...base, adult: "true" })).toMatchObject({ ok: false, field: "adult" });
    expect(parseApplication(null)).toMatchObject({ ok: false, field: "name" });
  });
});

describe("buildApplicationEmail", () => {
  it("lists samples and includes the optional answers only when given", () => {
    const r = parseApplication({ ...base, sample2: "https://example.com/b", worth: "Pay" });
    if (!r.ok) throw new Error("expected valid");
    const email = buildApplicationEmail("ed@example.com", r.value);
    expect(email.replyTo).toBe("sam@example.com");
    expect(email.text).toContain("- https://example.com/a\n- https://example.com/b");
    expect(email.text).toContain("What would make it worth their time:\nPay");
    expect(email.text).not.toContain("Social:");
  });
});
