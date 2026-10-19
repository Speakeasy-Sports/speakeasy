# Circle API notes

Record what the Admin v2 Swagger (api-headless.circle.so, Admin APIs) actually says before using an endpoint. See AGENTS.md section 13, items V4 and V5.

## Open items
- V4: Admin API v2 base URL, create-post body format (TipTap JSON vs. plain), image attachment on posts
- V5: whether Circle Workflows can call an external webhook on "comment created"

## What lib/circle/admin.ts assumes (not yet verified)

The Swagger and docs hosts were not reachable from the build environment on October 19, 2026, so these are unconfirmed. Sync is off (`CIRCLE_SYNC_ENABLED=false`) until each line is checked and corrected here and in `lib/circle/admin.ts`.

| Item | Assumed | Source |
|---|---|---|
| Base URL | `https://app.circle.so/api/admin/v2` (override with `CIRCLE_ADMIN_API_BASE`) | search snippet of an OpenAPI listing showing `/api/admin/v2/posts` |
| Auth | `Authorization: Bearer <token>` | Admin API quick start snippet; the OpenAPI snippet showed `Token <token>` instead. Unresolved |
| Create | `POST /posts` with `space_id`, `name`, `body` (HTML), `status`, `is_comments_enabled`, optional `cover_image_url` | not confirmed; body may need to be TipTap JSON (`tiptap_body`) |
| Update | `PUT /posts/{id}` with the same body | not confirmed |
| Response | `id`, `url` | not confirmed; the post object is known to carry `tiptap_body` |
| Comment count | not used yet | needed for 7.3 |

To verify: allow `api.circle.so` and `api-headless.circle.so` in the environment network settings, or paste the Admin v2 Swagger.
