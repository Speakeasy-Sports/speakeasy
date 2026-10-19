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
  await expect(page.locator(`[data-school="${SCHOOL.slice(1)}"]`).first()).toBeVisible();
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

test("social card renders", async ({ request }) => {
  const [, slug] = ARTICLE.split("/").filter(Boolean);
  const res = await request.get(`/api/og?slug=${slug}`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
});
