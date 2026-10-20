import { describe, expect, it } from "vitest";
import { sitemapXml } from "./sitemap";

describe("sitemapXml", () => {
  it("writes a valid urlset with optional fields", () => {
    const xml = sitemapXml([
      { url: "https://speakeasysports.com/", changeFrequency: "hourly", priority: 1 },
      { url: "https://speakeasysports.com/georgia/a-b", lastModified: "2026-10-20T12:12:47Z", priority: 0.8 },
    ]);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain("<url><loc>https://speakeasysports.com/</loc><changefreq>hourly</changefreq><priority>1</priority></url>");
    expect(xml).toContain("<lastmod>2026-10-20T12:12:47.000Z</lastmod>");
  });
  it("escapes URLs and drops unparseable dates", () => {
    const xml = sitemapXml([{ url: "https://x.test/?a=1&b=<2>", lastModified: "not a date" }]);
    expect(xml).toContain("<loc>https://x.test/?a=1&amp;b=&lt;2&gt;</loc>");
    expect(xml).not.toContain("lastmod");
  });
});
