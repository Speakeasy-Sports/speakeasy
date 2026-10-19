# Circle API notes

Record what the Admin v2 Swagger (api-headless.circle.so, Admin APIs) actually says before using an endpoint. See AGENTS.md section 13, items V4 and V5.

## Sources

- Admin API V2 Swagger: `https://api-headless.circle.so/api/admin/v2/swagger.yaml` (the "Admin API V2" entry in the Swagger UI). Read October 19, 2026.
- Docs: `https://api.circle.so/llms-full.txt` (Admin API quick start, TipTap guide, rate limits).

## V4: posts (verified from the Swagger)

| Item | Finding | Used in |
|---|---|---|
| Base URL | `https://app.circle.so/api/admin/v2` (Swagger server default host `app.circle.so`) | `CIRCLE_ADMIN_API_BASE` default |
| Auth | Quick start: `Authorization: Bearer <token>`. Swagger security scheme text: `Token <token>`. Using Bearer, as documented. Token type must be Admin V2 (Developers, Tokens); a wrong type returns 403 | `lib/circle/admin.ts` |
| Create | `POST /posts`. Required `space_id` (integer), `name`. Also `status` (draft, published, scheduled), `tiptap_body`, `cover_image`, `is_comments_enabled`, `skip_notifications`, `user_email` (author, preferred over `user_id`), `slug`, `meta_title`, `meta_description`, `opengraph_*` | create |
| Body format | TipTap JSON in `tiptap_body.body` (`{ type: "doc", content: [...] }`). The Swagger says to use it instead of `body_html`. Text in paragraph nodes; links are a `link` mark with `href` and `target` | `postBodyDoc` in `lib/circle/post.ts` |
| Create response | `{ message, post: { id, url, comments_count, ... } }` | `circlePostId`, `circlePostUrl` |
| Update | `PUT /posts/{id}` with the same fields. `tiptap_body` is applied only to posts that already have one, which ours always do | update |
| Show | `GET /posts/{id}` returns the post bare, including `comments_count` | comment counts (7.3) |
| Cover image | `cover_image` takes a `signed_id`, not a URL. Flow: `POST /direct_uploads` with `{ blob: { key, filename, content_type, byte_size, checksum } }` (checksum = base64 MD5), PUT the bytes to `direct_upload.url` with `direct_upload.headers`, then pass `signed_id`. One Admin API call per cover | `uploadCover` |
| Errors | 401 invalid token, 403 community not eligible for Admin API v2, 404 missing record, 429 rate limited (wait about 60 seconds) | `CircleApiError` |
| Rate limit | 2,000 requests per 5 minutes per IP | |

Call budget per article: 2 on create (upload + post), 1 per title or dek edit.

## V5: Workflows to webhook (partly verified)

The docs say webhook actions can be configured inside Workflows. The Admin API Swagger does not list workflow trigger types, so whether "comment created" is an available trigger still needs a look in the Circle admin (Workflows, New workflow).

## Not yet tested against a live community

Nothing above has been called with a real token. Before setting `CIRCLE_SYNC_ENABLED=true`: create an Admin V2 token, set `circleSpaceId` on the Georgia school, publish one test article, and check the post, link, and cover in Circle.
