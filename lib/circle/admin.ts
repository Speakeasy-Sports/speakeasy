import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { postBodyDoc, type CirclePostContent } from "./post";

// Circle Admin API v2 client. Server only: the token never reaches the browser (AGENTS.md section 3).
// Endpoints and fields are from the Admin API V2 Swagger, checked October 19, 2026 (docs/circle-api-notes.md).
// Sync runs only when CIRCLE_SYNC_ENABLED=true, so it can be switched on after a test post looks right.
const BASE = (process.env.CIRCLE_ADMIN_API_BASE || "https://app.circle.so/api/admin/v2").replace(/\/$/, "");
const ROUTE = "webhooks/sanity";

export function circleSyncEnabled(): boolean {
  return process.env.CIRCLE_SYNC_ENABLED === "true" && !!process.env.CIRCLE_ADMIN_API_TOKEN;
}

export class CircleApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Every Admin API call is logged with a route label so monthly usage stays visible (AGENTS.md section 14). */
async function call<T>(route: string, method: "GET" | "POST" | "PUT", path: string, body?: unknown): Promise<T> {
  const started = Date.now();
  let status = 0;
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        // The quick start documents Bearer; the Swagger's security scheme says "Token". Circle accepts the documented form.
        Authorization: `Bearer ${process.env.CIRCLE_ADMIN_API_TOKEN}`,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    status = res.status;
    if (!res.ok) throw new CircleApiError(res.status, `Circle ${method} ${path}: ${res.status} ${(await res.text()).slice(0, 300)}`);
    return (await res.json()) as T;
  } finally {
    console.log(JSON.stringify({ event: "circle_admin_api", route, method, path: path.replace(/\/\d+(?=\/|$)/g, "/:id"), status, ms: Date.now() - started }));
  }
}

type Post = { id?: number; url?: string | null; comments_count?: number };
/** Create and update wrap the post as { message, post }; show returns it bare. */
type PostEnvelope = Post & { post?: Post };
const unwrap = (r: PostEnvelope): Post => r.post ?? r;

type DirectUpload = { signed_id?: string; direct_upload?: { url?: string; headers?: Record<string, string> } };

/**
 * Cover images need a signed_id from the direct upload flow: register the blob, PUT the bytes to the presigned URL,
 * then pass signed_id as cover_image. One Admin API call. Returns null (post goes up without a cover) on any failure.
 */
async function uploadCover(imageUrl: string, route: string): Promise<string | null> {
  try {
    const img = await fetch(imageUrl, { cache: "no-store" });
    if (!img.ok) throw new Error(`image ${img.status}`);
    const bytes = Buffer.from(await img.arrayBuffer());
    const contentType = img.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    const up = await call<DirectUpload>(route, "POST", "/direct_uploads", {
      blob: {
        key: randomBytes(14).toString("hex"),
        filename: `cover.${contentType === "image/png" ? "png" : "jpg"}`,
        content_type: contentType,
        byte_size: bytes.byteLength,
        checksum: createHash("md5").update(bytes).digest("base64"),
      },
    });
    if (!up.signed_id || !up.direct_upload?.url) throw new Error("direct upload returned no url or signed_id");
    const put = await fetch(up.direct_upload.url, { method: "PUT", headers: up.direct_upload.headers ?? { "Content-Type": contentType }, body: bytes });
    if (!put.ok) throw new Error(`upload PUT ${put.status}`);
    return up.signed_id;
  } catch (err) {
    console.warn(JSON.stringify({ event: "circle_cover_upload_failed", error: String(err) }));
    return null;
  }
}

export type CirclePosts = {
  create(content: CirclePostContent): Promise<{ id: string; url: string | null }>;
  update(id: string, content: CirclePostContent): Promise<void>;
  /** Current comment count, for /api/webhooks/circle (AGENTS.md 7.3). */
  commentCount(id: string, route: string): Promise<number>;
};

export const circlePosts: CirclePosts = {
  async create(content) {
    const coverImage = content.imageUrl ? await uploadCover(content.imageUrl, ROUTE) : null;
    const res = unwrap(
      await call<PostEnvelope>(ROUTE, "POST", "/posts", {
        space_id: Number(content.spaceId),
        name: content.title,
        status: "published",
        tiptap_body: { body: postBodyDoc(content) },
        is_comments_enabled: true,
        ...(coverImage ? { cover_image: coverImage } : {}),
      }),
    );
    if (res.id === undefined) throw new Error("Circle create post returned no id");
    return { id: String(res.id), url: res.url ?? null };
  },
  async update(id, content) {
    // The cover is left as it was: re-uploading on every title or dek edit would spend calls for no change.
    await call<PostEnvelope>(ROUTE, "PUT", `/posts/${encodeURIComponent(id)}`, {
      name: content.title,
      tiptap_body: { body: postBodyDoc(content) },
    });
  },
  async commentCount(id, route) {
    return unwrap(await call<PostEnvelope>(route, "GET", `/posts/${encodeURIComponent(id)}`)).comments_count ?? 0;
  },
};
