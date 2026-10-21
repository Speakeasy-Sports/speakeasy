import { beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn(async () => {});
let allowed = true;
let configured = true;
vi.mock("server-only", () => ({}));
vi.mock("@/lib/email/postmark", () => ({ postmarkConfigured: () => configured, sendEmail: (...a: unknown[]) => send(...(a as [])) }));
vi.mock("@/lib/kv/rate-limit", () => ({ withinLimit: async () => allowed }));

process.env.EDITOR_NOTIFY_EMAIL = "editor@example.com";
const { POST } = await import("./route");

const good = {
  name: "Sam Writer",
  email: "sam@example.com",
  cover: "Georgia defense, weekly film breakdowns.",
  sample1: "https://example.com/one",
  sample2: "",
  social: "@sam",
  worth: "",
  adult: true,
  website: "",
  elapsed: 45000,
};

const post = (body: unknown) =>
  POST(new Request("http://localhost/api/write-for-us", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));

beforeEach(() => {
  send.mockClear();
  allowed = true;
  configured = true;
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("POST /api/write-for-us", () => {
  it("emails the editor with the applicant as Reply-To", async () => {
    const res = await post(good);
    expect(res.status).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]).toEqual([expect.objectContaining({ to: "editor@example.com", replyTo: "sam@example.com", subject: "Write for us: Sam Writer" })]);
  });
  it("quietly drops honeypot and too-fast submissions", async () => {
    expect((await post({ ...good, website: "spam.example" })).status).toBe(200);
    expect((await post({ ...good, elapsed: 500 })).status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });
  it("400s with the failing field", async () => {
    const res = await post({ ...good, adult: false });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ field: "adult" });
  });
  it("429s past the hourly limit and 503s when email is not set up", async () => {
    allowed = false;
    expect((await post(good)).status).toBe(429);
    allowed = true;
    configured = false;
    expect((await post(good)).status).toBe(503);
    expect(send).not.toHaveBeenCalled();
  });
});
