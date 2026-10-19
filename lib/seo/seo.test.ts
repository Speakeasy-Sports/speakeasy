import { describe, expect, it } from "vitest";
import { buildMetadata } from "./metadata";
import { absoluteUrl, articlePath, ogImageUrl } from "./site";
import { breadcrumbJsonLd, jsonLdString, newsArticleJsonLd } from "./structured-data";

describe("site urls", () => {
  it("builds absolute and article urls", () => {
    expect(absoluteUrl("/georgia/x")).toBe("https://speakeasysports.com/georgia/x");
    expect(absoluteUrl("georgia/x")).toBe("https://speakeasysports.com/georgia/x");
    expect(absoluteUrl("https://example.com/a")).toBe("https://example.com/a");
    expect(articlePath("georgia", "kirby-presser")).toBe("/georgia/kirby-presser");
    expect(ogImageUrl("a b")).toBe("https://speakeasysports.com/api/og?slug=a%20b");
  });
});

describe("buildMetadata", () => {
  it("sets canonical, OG, and Twitter for an article", () => {
    const meta = buildMetadata({
      title: "Headline",
      description: "Dek",
      path: "/georgia/headline",
      image: { url: "https://speakeasysports.com/api/og?slug=headline" },
      type: "article",
      article: { publishedTime: "2026-10-19T12:00:00Z", authors: ["Jon Smith"], section: "Georgia", tags: ["recruiting"] },
    });
    expect(meta.title).toBe("Headline");
    expect(meta.alternates?.canonical).toBe("https://speakeasysports.com/georgia/headline");
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.type).toBe("article");
    expect(og.url).toBe("https://speakeasysports.com/georgia/headline");
    expect(og.publishedTime).toBe("2026-10-19T12:00:00Z");
    expect(og.authors).toEqual(["Jon Smith"]);
    expect((meta.twitter as Record<string, unknown>).card).toBe("summary_large_image");
    expect(meta.robots).toBeUndefined();
  });

  it("falls back to the default description and honors noIndex", () => {
    const meta = buildMetadata({ title: "T", path: "/", description: "  ", noIndex: true });
    expect(meta.description).toBe("College sports coverage and community, built for fans.");
    expect(meta.robots).toEqual({ index: false, follow: true });
    expect((meta.twitter as Record<string, unknown>).card).toBe("summary");
  });
});

describe("structured data", () => {
  it("builds a NewsArticle with publisher and authors", () => {
    const ld = newsArticleJsonLd({
      headline: "H",
      description: "D",
      url: "https://speakeasysports.com/georgia/h",
      imageUrls: ["https://cdn.sanity.io/x.jpg"],
      datePublished: "2026-10-19T12:00:00Z",
      authors: [{ name: "Jon Smith", url: "https://speakeasysports.com/authors/jon-smith" }],
      section: "Georgia",
      keywords: ["recruiting", "qb"],
    });
    expect(ld["@type"]).toBe("NewsArticle");
    expect(ld.dateModified).toBe("2026-10-19T12:00:00Z");
    expect(ld.author[0]).toEqual({ "@type": "Person", name: "Jon Smith", url: "https://speakeasysports.com/authors/jon-smith" });
    expect(ld.publisher.name).toBe("Speakeasy Sports");
    expect(ld.keywords).toBe("recruiting, qb");
  });

  it("numbers breadcrumbs and escapes closing tags", () => {
    const crumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Georgia", path: "/georgia" },
    ]);
    expect(crumbs.itemListElement[1]).toEqual({ "@type": "ListItem", position: 2, name: "Georgia", item: "https://speakeasysports.com/georgia" });
    expect(jsonLdString({ a: "</script><script>alert(1)" })).not.toContain("</script>");
  });
});
