import { beforeEach, describe, expect, it, vi } from "vitest";

class CircleApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
const get = vi.fn(async () => ({ status: "published", elements: [{ id: 124, type: "field", attributes: { field_type: "contact_email", required: true } }] }));
const submit = vi.fn(async () => {});
let allowed = true;
vi.mock("server-only", () => ({}));
vi.mock("@/lib/circle/admin", () => ({
  CircleApiError,
  newsletterConfigured: () => !!process.env.CIRCLE_NEWSLETTER_FORM_ID,
  circleForms: { get: (...a: unknown[]) => get(...(a as [])), submit: (...a: unknown[]) => submit(...(a as [])) },
}));
vi.mock("@/lib/kv/rate-limit", () => ({ withinLimit: async () => allowed }));

const { POST } = await import("./route");
const { resetFormCache } = await import("@/lib/circle/newsletter");
const post = (body: unknown) =>
  POST(new Request("http://localhost/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));

beforeEach(() => {
  get.mockClear();
  submit.mockReset();
  allowed = true;
  process.env.CIRCLE_NEWSLETTER_FORM_ID = "77";
  resetFormCache();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("POST /api/newsletter", () => {
  it("submits the email to the form's profile email field, reading the form once", async () => {
    expect((await post({ email: " fan@example.com ", school: "georgia", website: "" })).status).toBe(200);
    expect((await post({ email: "two@example.com" })).status).toBe(200);
    expect(get).toHaveBeenCalledTimes(1);
    expect(submit.mock.calls[0]).toEqual(["77", [{ id: 124, value: "fan@example.com" }], "api/newsletter"]);
  });
  it("drops honeypot hits and rejects bad addresses without calling Circle", async () => {
    expect((await post({ email: "fan@example.com", website: "x" })).status).toBe(200);
    expect((await post({ email: "not-an-email" })).status).toBe(400);
    expect(submit).not.toHaveBeenCalled();
  });
  it("503s until Circle is set up, and when the form cannot be used", async () => {
    delete process.env.CIRCLE_NEWSLETTER_FORM_ID;
    expect((await post({ email: "fan@example.com" })).status).toBe(503);
    process.env.CIRCLE_NEWSLETTER_FORM_ID = "77";
    get.mockResolvedValueOnce({ status: "draft", elements: [] });
    expect((await post({ email: "fan@example.com" })).status).toBe(503);
    submit.mockRejectedValueOnce(new CircleApiError(401, "You cannot perform this action."));
    expect((await post({ email: "fan@example.com" })).status).toBe(503);
  });
  it("maps Circle's 422 to a 400 and other failures to a 502", async () => {
    submit.mockRejectedValueOnce(new CircleApiError(422, "Validation failed"));
    expect(await (await post({ email: "fan@example.com" })).json()).toEqual({ error: "Check your email address." });
    submit.mockRejectedValueOnce(new Error("network"));
    expect((await post({ email: "fan@example.com" })).status).toBe(502);
  });
  it("429s past the hourly limit", async () => {
    allowed = false;
    expect((await post({ email: "fan@example.com" })).status).toBe(429);
  });
});
