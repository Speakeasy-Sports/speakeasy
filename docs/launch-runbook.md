# Launch runbook

Launch: Monday, November 9, 2026. Owner: Jon. This is the order of operations from merging the last PRs to the end of launch week. `docs/setup.md` has the one-time setup detail; this file says when to do each part and how to tell it worked.

Every server step writes one JSON log line in Vercel (Project, Logs). The event names below are what to search for.

## 1. Merge the open work (by October 30)

1. Merge #13 (launch QA fixes) and #11 (editable copy, menus, SEO), in either order.
2. Retarget #12 (front page curation) to `main`. Before merging it:
   - Run `node scripts/migrate-featured-to-front-page.mjs` with production env vars. It is a dry run: check the four titles it lists.
   - Run it again with `--apply`. The live site ignores the new Front page document until #12 deploys.
   - In sanity.io/manage, add `"frontPage"` to the Site publish webhook filter (section 3 below).
3. Merge #12. After the deploy is live, run the script with `--apply --unset-old` to remove the old `featured` and `featuredRank` fields.

## 2. Production environment variables (Vercel, Production)

Missing values do not fail the build; the feature quietly turns off. Check each one.

| Variable | If missing |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical links, feeds, and share images point at the wrong host |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET` | Site has no content |
| `SANITY_API_READ_TOKEN` | Draft mode and Studio preview do not work |
| `SANITY_API_WRITE_TOKEN` (Editor role) | Status never flips to published; no Circle posts |
| `SANITY_WEBHOOK_SECRET` | Every Sanity webhook is rejected; edits wait for the 60-second refresh |
| `CIRCLE_ADMIN_API_TOKEN` (Admin V2 type) | No Circle posts, no comment counts, no newsletter signups |
| `CIRCLE_SYNC_ENABLED` | `false` until the test post in section 5 looks right, then `true` |
| `CIRCLE_WEBHOOK_SECRET` | Comment-count webhooks rejected (the daily job still refreshes counts) |
| `CIRCLE_NEWSLETTER_FORM_ID` | Newsletter form says "Signups open soon" |
| `CIRCLE_BASE_URL` | Join links fall back to the default community URL |
| `POSTMARK_SERVER_TOKEN`, `POSTMARK_FROM`, `EDITOR_NOTIFY_EMAIL` | No review emails; Write for us says "Applications are not open yet" |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | No duplicate-post lock (`kv_lock_skipped` in logs), no rate limits, no API usage counts |
| `CRON_SECRET` | Daily Circle job is rejected: no retries, no count refresh |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | No analytics |

`TURNSTILE_*` and the Phase 2 `AUTH_*` values are not needed for launch.

## 3. Accounts (by November 2)

Sanity (sanity.io/manage):
- Roles assigned: Jon Administrator, editors Editor, writers Contributor. Scheduled Publishing enabled. CORS origins include `https://speakeasysports.com`.
- Two webhooks to `https://speakeasysports.com/api/webhooks/sanity`, exactly as in `docs/setup.md` section 5. The Site publish filter must include `"frontPage"` once #12 is merged.

Studio content:
- Site settings: name, tagline, join URL, default share image (1200x630), newsletter headline and blurb, schools in the header.
- Georgia school: `circleSpaceId` and `circleJoinUrl` set, accent colors, section tags.
- All five pages published: About, Contact, Terms, Privacy, Write for us. A missing page is a 404, and the footer links all five. Terms and Privacy need final copy from counsel; the 13+ age policy goes in Terms.
- Authors with photo and alt text for everyone writing at launch.

Circle:
- Admin V2 token created (Developers, Tokens).
- Workflow for "comment created" sending to `/api/webhooks/circle` (`docs/setup.md` section 6). If the trigger does not exist, that answers V5: switch the cron to every few hours and decide V9.
- Email Hub on, newsletter form published with only the email field required (`docs/setup.md` section 8).

Postmark: sending domain `mail.speakeasysports.com` verified (DKIM and return-path), stream `speakeasy-transactional`.

Plausible: site added, and the goals `join_click`, `newsletter_signup`, `discuss_click`, `podcast_play`, `video_play` created in the dashboard. Events that are not set up as goals are recorded but do not show in the goal report.

## 4. Search engines (by November 2)

- Google Search Console and Bing Webmaster Tools: verify the domain and submit `https://speakeasysports.com/sitemap.xml`.
- Check `https://speakeasysports.com/robots.txt` allows everything except `/studio` and `/api/`.

## 5. Dress rehearsal (week of November 2)

This is the Phase 1 acceptance test. The domain is already live and the webhooks point at production, so rehearse there with a test article: tick `noIndex`, give it an obvious title, and delete it afterward along with its Circle post.

| # | Do | Expect | Log line |
|---|---|---|---|
| 1 | As a Contributor, write a draft and set status to Review | Email to the editor with a Studio link | `review_notified` |
| 2 | As an Editor, schedule it five minutes out | At the scheduled time it appears on the home page and Georgia front within a minute; status shows Published in the Studio | `sanity_webhook`, `article_finalized` |
| 3 | With `CIRCLE_SYNC_ENABLED=false`, confirm nothing posted. Set it to `true`, redeploy, edit the dek, and publish again | One Circle post in the Georgia space: title, dek, "Read the full story" link, cover image. The article's "Discuss in Dawg Social Club" button now opens that post instead of the join page | `circle_admin_api` |
| 4 | Comment on that Circle post | Comment count on the article updates within a minute | `circle_comment_count` (`circle_webhook_unrecognized` means the payload keys need mapping) |
| 5 | Sign up for the newsletter from the footer band with a real address | Success message; contact appears in Circle, Marketing, Contacts. Note whether Circle sends a confirmation email | `newsletter_signup` |
| 6 | Submit a Write for us application | Email to the editor with Reply-To set to the applicant | `application_sent` |
| 7 | Put a story first in Front page | Home lead changes within seconds | `sanity_webhook` |
| 8 | Change one Site settings copy field, then clear it | Text changes, then returns to the default | `sanity_webhook` |
| 9 | Lighthouse mobile on home, `/georgia`, and an article | 95+ in all four categories; article LCP under 2.5s | |
| 10 | Clean up | Delete the test article, its Circle post, and the test contact | |

If step 5 says "Check your email address" for a valid address, apply the one-line `elementable_id` switch in `docs/circle-api-notes.md` (V3).

## 6. Launch day (Monday, November 9)

Before announcing:
- 15 to 20 articles live, Front page picks set, authors and photos in place.
- Smoke check, all should load: `/`, `/georgia`, one article, `/podcasts` and `/videos` (if any are published), `/search?q=georgia`, `/newsletter`, `/write-for-us`, `/about`, `/terms`, `/privacy`, `/feed.xml`, `/georgia/feed.xml`, `/sitemap.xml`, `/robots.txt`.
- `https://www.speakeasysports.com` redirects to the apex, `http://` to `https://`.
- Phone check at 390px in light and dark mode: header, an article, the footer.
- Share one article link in a text message and on X: the preview shows the headline image.

Then announce, and send the first Email Hub issue.

## 7. Launch week: what to watch

Daily:
- Vercel logs for `article_finalize_failed`, `review_notify_failed`, `newsletter_failed`, `newsletter_rejected`, `application_send_failed`, `circle_webhook_unrecognized`, `kv_lock_skipped`.
- Studio: any article showing a Circle sync error. The daily job (9:17 UTC, `circle_daily`) retries it; a second failure needs a look.
- Circle: one post per new article, no duplicates.

Monday, November 16: the `circle_admin_api_weekly` log line has last week's Admin API calls by route. Expect well under 1,000: about two per new article, one per comment burst, and the daily count refresh for the last 7 days of articles. The target is under 5,000 a month.

## 8. If something breaks

| Symptom | Likely cause | Fix |
|---|---|---|
| Published article not on the site after a minute | Webhook secret mismatch or filter excludes the type | Check `sanity_webhook` lines; the 60-second refresh shows it regardless |
| Status stuck on Scheduled or Review after publish | Write token missing or not Editor role | Fix `SANITY_API_WRITE_TOKEN`; republish |
| No Circle post | Sync off, no `circleSpaceId`, or wrong token type (403) | Fix, then republish or wait for the daily retry |
| Two Circle posts for one article | KV not configured, so no lock | Set the KV variables; delete the duplicate in Circle |
| Comment counts not moving | Workflow missing or rejected | Check `circle_comment_count`; the daily job refreshes counts for 7 days |
| Front page edit not showing | `frontPage` missing from the webhook filter | Add it; the 60-second refresh covers the gap |
| "Signups open soon" | Token or form id missing | Set `CIRCLE_ADMIN_API_TOKEN` and `CIRCLE_NEWSLETTER_FORM_ID` |
| "Applications are not open yet" | Postmark or `EDITOR_NOTIFY_EMAIL` missing | Set them |
| A bad deploy | | Vercel, Deployments, the last good one, Instant Rollback. Content is unaffected |
| A content mistake | | Studio, the document's history, restore the earlier version and publish. Corrections go in the Correction field, never silently |
