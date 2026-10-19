import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
process.env.CIRCLE_ADMIN_API_TOKEN = "tok";
const { circlePosts } = await import("./admin");

const content = { spaceId: "42", title: "Healthy line", dek: "The dek", url: "https://speakeasysports.com/georgia/healthy-line", imageUrl: null };

type Call = { url: string; init: RequestInit };
let calls: Call[];

function respond(...bodies: Array<{ status?: number; json?: unknown; bytes?: Uint8Array<ArrayBuffer>; type?: string }>) {
  let i = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({ url, init });
      const b = bodies[i++] ?? { status: 500 };
      const status = b.status ?? 200;
      if (b.bytes) return new Response(b.bytes, { status, headers: { "content-type": b.type ?? "image/jpeg" } });
      return new Response(JSON.stringify(b.json ?? {}), { status, headers: { "content-type": "application/json" } });
    }),
  );
}

const body = (c: Call) => JSON.parse(String(c.init.body));

beforeEach(() => {
  calls = [];
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => vi.unstubAllGlobals());

describe("circlePosts", () => {
  it("creates a published post with a TipTap body in the school space", async () => {
    respond({ json: { message: "Post created.", post: { id: 2, url: "https://club.speakeasysports.com/c/georgia/healthy-line" } } });
    expect(await circlePosts.create(content)).toEqual({ id: "2", url: "https://club.speakeasysports.com/c/georgia/healthy-line" });
    const [c] = calls;
    expect(c!.url).toBe("https://app.circle.so/api/admin/v2/posts");
    expect(c!.init.method).toBe("POST");
    expect((c!.init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    const b = body(c!);
    expect(b).toMatchObject({ space_id: 42, name: "Healthy line", status: "published", is_comments_enabled: true });
    expect(b.tiptap_body.body.type).toBe("doc");
    expect(b).not.toHaveProperty("cover_image");
  });

  it("uploads the hero as the cover through a direct upload", async () => {
    const jpg = new Uint8Array([1, 2, 3, 4]);
    respond(
      { bytes: jpg },
      { json: { signed_id: "sig1", direct_upload: { url: "https://upload.example/x", headers: { "Content-Type": "image/jpeg" } } } },
      { status: 200, json: {} },
      { json: { post: { id: 3, url: "https://club.example/p3" } } },
    );
    await circlePosts.create({ ...content, imageUrl: "https://cdn.sanity.io/images/p/d/a.jpg?w=1200" });
    expect(calls.map((c) => [c.init.method ?? "GET", c.url])).toEqual([
      ["GET", "https://cdn.sanity.io/images/p/d/a.jpg?w=1200"],
      ["POST", "https://app.circle.so/api/admin/v2/direct_uploads"],
      ["PUT", "https://upload.example/x"],
      ["POST", "https://app.circle.so/api/admin/v2/posts"],
    ]);
    expect(body(calls[1]!).blob).toMatchObject({ content_type: "image/jpeg", byte_size: 4, checksum: "CNbAWiFRKnmh3+udKo8mLw==" });
    expect(body(calls[3]!).cover_image).toBe("sig1");
  });

  it("posts without a cover when the upload fails", async () => {
    respond({ status: 404 }, { json: { post: { id: 4 } } });
    expect(await circlePosts.create({ ...content, imageUrl: "https://cdn.sanity.io/x.jpg" })).toEqual({ id: "4", url: null });
    expect(body(calls[1]!)).not.toHaveProperty("cover_image");
  });

  it("updates name and body with PUT, and reads comment counts", async () => {
    respond({ json: { post: { id: 2 } } }, { json: { id: 2, comments_count: 7 } });
    await circlePosts.update("2", content);
    expect(calls[0]!.init.method).toBe("PUT");
    expect(calls[0]!.url).toBe("https://app.circle.so/api/admin/v2/posts/2");
    expect(Object.keys(body(calls[0]!))).toEqual(["name", "tiptap_body"]);
    expect(await circlePosts.commentCount("2", "webhooks/circle")).toBe(7);
  });

  it("surfaces API errors with the status", async () => {
    respond({ status: 403, json: { message: "The community is not eligible for admin API v2 access." } });
    await expect(circlePosts.create(content)).rejects.toThrow(/403/);
  });
});
