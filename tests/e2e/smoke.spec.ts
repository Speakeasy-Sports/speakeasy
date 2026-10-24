import { expect, test } from "@playwright/test";

// Runs against a server started with the mock Sanity fixtures (see docs/setup.md, "Local smoke test")
// or against a real dataset when E2E_ARTICLE_PATH points at a published article.
const ARTICLE = process.env.E2E_ARTICLE_PATH ?? "/georgia/fourth-quarter-collapse-defensive-rotation";
const PODCAST = process.env.E2E_PODCAST_PATH ?? "/georgia/bye-week-mailbag";
const SCHOOL = process.env.E2E_SCHOOL_PATH ?? "/georgia";

test("home renders the latest list and the join button", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Latest" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Join the Club" })).toBeVisible();
  await expect(page.locator("article").first()).toBeVisible();
});

test("school section renders with its accent", async ({ page }) => {
  const res = await page.goto(SCHOOL);
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator(`main [data-school="${SCHOOL.slice(1)}"]`).first()).toBeVisible();
});

test("article page has the full top-to-bottom structure", async ({ page }) => {
  const res = await page.goto(ARTICLE);
  expect(res?.status()).toBe(200);

  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", new RegExp(`${ARTICLE}$`));
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");

  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(ld.some((s) => s.includes('"NewsArticle"'))).toBe(true);
  expect(ld.some((s) => s.includes('"BreadcrumbList"'))).toBe(true);

  await expect(page.locator("time").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Discuss in/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /newsletter/i })).toBeVisible();
});

test("article embeds load lazily and keep their frames", async ({ page }) => {
  await page.goto(ARTICLE);
  const frame = page.locator('[data-media-frame="video"]').first();
  await expect(frame).toBeVisible();
  await expect(frame.locator("iframe")).toHaveCount(0);
  await frame.getByRole("button", { name: /Play video/ }).click();
  await expect(frame.locator("iframe")).toHaveCount(1);
});

test("podcast lead shows the player and episode notes", async ({ page }) => {
  await page.goto(PODCAST);
  await expect(page.locator('[data-media-frame="podcast"] iframe').first()).toBeAttached();
  await expect(page.getByRole("list").filter({ hasText: "Intro" })).toBeVisible();
});

test("non-canonical school path redirects, unknown school 404s", async ({ page, request }) => {
  const [, slug] = ARTICLE.split("/").filter(Boolean);
  const redirect = await request.get(`/alabama/${slug}`, { maxRedirects: 0 });
  expect(redirect.status()).toBe(308);
  expect(redirect.headers()["location"]).toMatch(new RegExp(`${ARTICLE}$`));

  const missing = await page.goto(`/nowhere/${slug}`);
  expect(missing?.status()).toBe(404);
});

test("national front and a text-only national article", async ({ page }) => {
  await page.goto("/national");
  await expect(page.getByRole("heading", { level: 1, name: "National" })).toBeVisible();
  await page.getByRole("link", { name: /Every tailgate has a rulebook/ }).first().click();
  await expect(page).toHaveURL(/\/national\/tailgate-rulebook$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Every tailgate has a rulebook");
  // Text only: no hero figure, and no Georgia discuss or join button for a national story.
  await expect(page.locator("article figure")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Dawg Social Club/ })).toHaveCount(0);
  // Related stories include other national coverage.
  await expect(page.getByRole("link", { name: /Why the road trip is the best part/ }).first()).toBeVisible();
});

test("national and school article URLs redirect to their canonical scope", async ({ request }) => {
  // A national story associated with Georgia is still canonical at /national.
  const toNational = await request.get("/georgia/road-trip-best-part", { maxRedirects: 0 });
  expect(toNational.status()).toBe(308);
  expect(toNational.headers()["location"]).toMatch(/\/national\/road-trip-best-part$/);
  const toSchool = await request.get("/national/healthy-line-ole-miss", { maxRedirects: 0 });
  expect(toSchool.status()).toBe(308);
  expect(toSchool.headers()["location"]).toMatch(/\/georgia\/healthy-line-ole-miss$/);
});

test("social card renders", async ({ request }) => {
  const [, slug] = ARTICLE.split("/").filter(Boolean);
  const res = await request.get(`/api/og?slug=${slug}`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
});

test("front pages paginate through the ?page= rewrite and stay canonical", async ({ page }) => {
  const res = await page.goto("/?page=2");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Latest, page 2" })).toBeVisible();
  await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", /\/\?page=2$/);
  expect((await page.goto("/?page=99"))?.status()).toBe(404);
  const school = await page.goto(`${SCHOOL}?page=2`);
  expect(school?.status()).toBe(200);
  await expect(page.getByRole("link", { name: /Newer/ })).toBeVisible();
});

test("school sub-nav carries the reader into filtered podcasts and tags", async ({ page }) => {
  await page.goto(SCHOOL);
  const subnav = () => page.locator("main").getByRole("navigation", { name: /sections$/ });
  await subnav().getByRole("link", { name: "Podcasts" }).click();
  await expect(page).toHaveURL(/\/podcasts\?school=/);
  await expect(subnav().getByRole("link", { name: "Podcasts" })).toHaveAttribute("aria-current", "page");
  await page.goto("/tags/recruiting");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Recruiting");
});

test("author, newsletter, and info pages render", async ({ page }) => {
  for (const path of ["/authors/jon-smith", "/newsletter", "/about", "/privacy", "/videos"]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
  }
});

test("write for us page shows the application and is linked from the footer", async ({ page }) => {
  await page.goto("/about");
  await page.getByRole("contentinfo").getByRole("link", { name: "Write for us" }).click();
  await expect(page).toHaveURL(/\/write-for-us$/);
  await expect(page.getByRole("heading", { level: 1, name: "Write for us" })).toBeVisible();
  await expect(page.getByLabel("What would you cover?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send application" })).toBeVisible();
});

test("newsletter form reaches the handler and says when signups are not open", async ({ page }) => {
  // CI has no Circle token or form id, so the handler answers 503 with its own message.
  await page.goto("/newsletter");
  await page.getByLabel("Email address").first().fill("fan@example.com");
  await page.getByRole("button", { name: "Sign up" }).first().click();
  await expect(page.getByRole("alert").filter({ hasText: "Signups open soon" })).toBeVisible();
});

test("search finds stories from the prebuilt index", async ({ page }) => {
  await page.goto("/search?q=quarterback");
  await expect(page.getByText(/\d+ stor(y|ies)/)).toBeVisible();
  await expect(page.locator("ol li").first()).toBeVisible();
});

test("feeds, sitemap, and robots are served", async ({ request }) => {
  const feed = await request.get("/feed.xml");
  expect(feed.headers()["content-type"]).toContain("application/rss+xml");
  expect(await feed.text()).toContain("<item>");
  expect((await request.get(`${SCHOOL}/feed.xml`)).status()).toBe(200);
  expect(await (await request.get("/sitemap.xml")).text()).toContain(ARTICLE);
  expect(await (await request.get("/robots.txt")).text()).toContain("Sitemap:");
});

test("sanity webhook rejects unsigned requests", async ({ request }) => {
  const res = await request.post("/api/webhooks/sanity", { data: { _id: "a1", _type: "article" } });
  // 401 with a secret configured, 500 when the server has none. Never 200.
  expect([401, 500]).toContain(res.status());
});

test("circle webhook and daily job reject unauthenticated requests", async ({ request }) => {
  const hook = await request.post("/api/webhooks/circle", { data: { post_id: 1 } });
  expect([401, 500]).toContain(hook.status());
  expect((await request.get("/api/cron/circle-daily")).status()).toBe(401);
});
