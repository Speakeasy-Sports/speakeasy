import "server-only";
import { postBodyHtml, type CirclePostContent } from "./post";

// Circle Admin API v2 client. Server only: the token never reaches the browser (AGENTS.md section 3).
//
// PENDING V4: the base URL, auth header, and request and response fields below are not yet confirmed against the
// Admin v2 Swagger (see docs/circle-api-notes.md). Sync stays off until CIRCLE_SYNC_ENABLED=true, which should only
// be set once those are verified and this file matches them.
const BASE = (process.env.CIRCLE_ADMIN_API_BASE ?? "https://app.circle.so/api/admin/v2").replace(/\/$/, "");

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
async function call<T>(route: string, method: "GET" | "POST" | "PUT" | "PATCH", path: string, body?: unknown): Promise<T> {
  const started = Date.now();
  let status = 0;
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
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
    console.log(JSON.stringify({ event: "circle_admin_api", route, method, path: path.replace(/\/\d+/g, "/:id"), status, ms: Date.now() - started }));
  }
}

type PostResponse = { id?: number | string; url?: string };

function requestBody(c: CirclePostContent) {
  return {
    space_id: Number(c.spaceId),
    name: c.title,
    body: postBodyHtml(c),
    ...(c.imageUrl ? { cover_image_url: c.imageUrl } : {}),
    status: "published",
    is_comments_enabled: true,
  };
}

export type CirclePosts = {
  create(content: CirclePostContent): Promise<{ id: string; url: string | null }>;
  update(id: string, content: CirclePostContent): Promise<void>;
};

export const circlePosts: CirclePosts = {
  async create(content) {
    const res = await call<PostResponse>("webhooks/sanity", "POST", "/posts", requestBody(content));
    if (res.id === undefined) throw new Error("Circle create post returned no id");
    return { id: String(res.id), url: res.url ?? null };
  },
  async update(id, content) {
    await call<PostResponse>("webhooks/sanity", "PUT", `/posts/${encodeURIComponent(id)}`, requestBody(content));
  },
};
