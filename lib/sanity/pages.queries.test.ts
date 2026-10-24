import { describe, expect, it } from "vitest";
import { evaluate, parse } from "groq-js";
import { dataset } from "../../scripts/fixtures/dataset.mjs";
import {
  AUTHOR_QUERY,
  FEED_QUERY,
  HOME_QUERY,
  INFO_PAGE_QUERY,
  ARTICLE_QUERY,
  NATIONAL_FRONT_QUERY,
  MEDIA_QUERY,
  SCHOOL_FEED_QUERY,
  SCHOOL_FRONT_QUERY,
  SEARCH_INDEX_QUERY,
  SITEMAP_QUERY,
  SITE_SIGNALS_QUERY,
  TAG_QUERY,
} from "./queries";
import { pageQuery } from "./paginate";

// Runs the page queries against the same fixture dataset the mock server and smoke tests use.

type Card = { _id: string; slug: string; contentType: string; school: { slug: string } | null };

async function run<T>(query: string, params: Record<string, unknown> = {}): Promise<T> {
  const value = await evaluate(parse(query, { params }), { dataset, params });
  return (await value.get()) as T;
}

const live = (dataset as Array<{ _type: string; coverageScope?: string; primarySchool?: unknown; slug?: { current?: string } }>).filter(
  (d) => d._type === "article" && (d.coverageScope === "national" || d.primarySchool) && d.slug?.current,
);

describe("HOME_QUERY", () => {
  it("puts featured ranks 1 to 4 on top in rank order", async () => {
    const home = await run<{ top: Card[] }>(HOME_QUERY);
    expect(home.top.map((a) => a.slug)).toEqual([
      "fourth-quarter-collapse-defensive-rotation",
      "bye-week-mailbag",
      "five-plays-georgia-texas",
      "tight-end-screen-film-room",
    ]);
  });

  it("never repeats a top story in Latest, on any page, and pages cover every other story once", async () => {
    const home = await run<{ top: Card[]; latest: Card[]; count: number }>(HOME_QUERY);
    const page2 = await run<{ latest: Card[] }>(pageQuery(HOME_QUERY, "[0...20]", 2, 20));
    const topIds = new Set(home.top.map((a) => a._id));
    const seen = [...home.latest, ...page2.latest].map((a) => a._id);
    expect(seen.some((id) => topIds.has(id))).toBe(false);
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen.length + home.top.length).toBe(home.count);
    expect(home.count).toBe(live.length);
  });

  it("lists recent podcasts and videos for the rail, never repeating a top story", async () => {
    const home = await run<{ media: Card[]; top: Card[] }>(HOME_QUERY);
    expect(home.media).toHaveLength(4);
    expect(home.media.every((a) => a.contentType === "podcast" || a.contentType === "video")).toBe(true);
    const topIds = new Set(home.top.map((a) => a._id));
    expect(home.media.some((a) => topIds.has(a._id))).toBe(false);
    const ga = await run<{ media: Card[]; top: Card[] }>(SCHOOL_FRONT_QUERY, { slug: "georgia" });
    const gaTop = new Set(ga.top.map((a) => a._id));
    expect(ga.media.length).toBeGreaterThan(0);
    expect(ga.media.some((a) => gaTop.has(a._id))).toBe(false);
  });
});

describe("SCHOOL_FRONT_QUERY", () => {
  it("scopes everything to the school and returns curated tags in order", async () => {
    const s = await run<{ top: Card[]; latest: Card[]; count: number; navTags: { slug: string }[] }>(SCHOOL_FRONT_QUERY, {
      slug: "alabama",
    });
    // Two Alabama-listed stories: the cross-listed lead and the Alabama-only one.
    expect(s.count).toBe(2);
    expect(s.top).toHaveLength(2);
    expect(s.latest).toHaveLength(0);
    const ga = await run<{ navTags: { slug: string }[]; top: Card[]; latest: Card[]; count: number }>(SCHOOL_FRONT_QUERY, {
      slug: "georgia",
    });
    expect(ga.navTags.map((t) => t.slug)).toEqual(["recruiting", "quarterbacks", "defense", "film-room", "portal", "basketball"]);
    expect(ga.top.length + ga.latest.length).toBe(Math.min(ga.count, 24));
  });
});

describe("AUTHOR_QUERY, TAG_QUERY, MEDIA_QUERY", () => {
  it("lists an author's stories newest first", async () => {
    const a = await run<{ articles: Card[]; count: number }>(AUTHOR_QUERY, { slug: "avery-collins" });
    expect(a.count).toBeGreaterThan(0);
    expect(a.articles.length).toBe(Math.min(a.count, 12));
  });

  it("filters a tag by school, and lists only schools that have stories under the tag", async () => {
    const all = await run<{ count: number; school: unknown; schools: { slug: string }[] }>(TAG_QUERY, { slug: "recruiting", school: "" });
    const ga = await run<{ count: number; school: { slug: string } }>(TAG_QUERY, { slug: "recruiting", school: "georgia" });
    const bama = await run<{ count: number }>(TAG_QUERY, { slug: "recruiting", school: "alabama" });
    expect(all.school).toBeNull();
    expect(all.schools.map((s) => s.slug)).toEqual(["georgia"]);
    expect(ga.school.slug).toBe("georgia");
    expect(ga.count).toBe(all.count);
    expect(bama.count).toBe(0);
  });

  it("returns only the requested media type", async () => {
    const pods = await run<{ articles: Card[]; count: number }>(MEDIA_QUERY, { type: "podcast", school: "" });
    const vids = await run<{ articles: Card[]; count: number }>(MEDIA_QUERY, { type: "video", school: "georgia" });
    expect(pods.articles.every((a) => a.contentType === "podcast")).toBe(true);
    expect(vids.articles.every((a) => a.contentType === "video")).toBe(true);
    expect(pods.count).toBe(4);
    expect(vids.count).toBe(3);
  });
});

describe("feeds, sitemap, search, pages", () => {
  it("builds canonical URLs in the search index", async () => {
    const idx = await run<{ u: string; t: string }[]>(SEARCH_INDEX_QUERY);
    expect(idx).toHaveLength(live.length);
    expect(idx.every((i) => /^\/[a-z0-9-]+\/[a-z0-9-]+$/.test(i.u))).toBe(true);
  });

  it("feeds are newest first and per-school feeds include cross-listed stories", async () => {
    const feed = await run<{ published: string }[]>(FEED_QUERY);
    const dates = feed.map((i) => i.published);
    expect([...dates].sort().reverse()).toEqual(dates);
    const bama = await run<{ items: { slug: string }[] }>(SCHOOL_FEED_QUERY, { slug: "alabama" });
    expect(bama.items.map((i) => i.slug)).toContain("fourth-quarter-collapse-defensive-rotation");
  });

  it("sitemap lists every kind of page", async () => {
    const sm = await run<Record<string, unknown[]>>(SITEMAP_QUERY);
    expect(sm.articles).toHaveLength(live.length);
    expect(sm.schools).toHaveLength(2);
    expect(sm.authors).toHaveLength(3);
    expect(sm.tags).toHaveLength(6);
    expect(sm.pages).toHaveLength(5);
  });

  it("counts what the launch-stage switches need", async () => {
    const counts = await run<{ articles: number; podcasts: number; videos: number; authors: number }>(SITE_SIGNALS_QUERY);
    expect(counts.articles).toBe(live.length);
    expect(counts.podcasts).toBe(live.filter((d) => (d as { contentType?: string }).contentType === "podcast").length);
    expect(counts.videos).toBe(live.filter((d) => (d as { contentType?: string }).contentType === "video").length);
    expect(counts.authors).toBe(new Set(live.flatMap((d) => ((d as { authors?: { _ref: string }[] }).authors ?? []).map((a) => a._ref))).size);
  });

  it("finds info pages by slug", async () => {
    const p = await run<{ title: string } | null>(INFO_PAGE_QUERY, { slug: "privacy" });
    expect(p?.title).toBe("Privacy");
  });
});

describe("pageQuery", () => {
  it("rejects a missing or repeated marker", () => {
    expect(() => pageQuery("*[0...4]", "[0...20]", 2, 20)).toThrow();
    expect(() => pageQuery("*[0...20] + *[0...20]", "[0...20]", 2, 20)).toThrow();
    expect(pageQuery("x[0...20]", "[0...20]", 3, 20)).toBe("x[40...60]");
  });
});

describe("national coverage", () => {
  type Story = { slug: string; scope: string; path: string; school: { slug: string } | null };

  it("puts national stories on /national with national paths and no school", async () => {
    const front = await run<{ top: Story[]; latest: Story[]; count: number }>(NATIONAL_FRONT_QUERY);
    const all = [...front.top, ...front.latest];
    expect(all.map((a) => a.slug).sort()).toEqual(["road-trip-best-part", "tailgate-rulebook"]);
    expect(front.count).toBe(2);
    for (const a of all) {
      expect(a.scope).toBe("national");
      expect(a.school).toBeNull();
      expect(a.path).toBe(`/national/${a.slug}`);
    }
  });

  it("shows a national story on a school front it is associated with, still linking to /national", async () => {
    const ga = await run<{ top: Story[]; latest: Story[] }>(SCHOOL_FRONT_QUERY, { slug: "georgia" });
    const roadTrip = [...ga.top, ...ga.latest].find((a) => a.slug === "road-trip-best-part");
    expect(roadTrip?.path).toBe("/national/road-trip-best-part");
    const bama = await run<{ top: Story[]; latest: Story[] }>(SCHOOL_FRONT_QUERY, { slug: "alabama" });
    expect([...bama.top, ...bama.latest].some((a) => a.scope === "national")).toBe(false);
  });

  it("treats school stories saved before coverageScope existed as school stories", async () => {
    const home = await run<{ top: Story[] }>(HOME_QUERY);
    expect(home.top[0]).toMatchObject({ scope: "school", path: "/georgia/fourth-quarter-collapse-defensive-rotation" });
  });

  it("loads a text-only national article with national related stories", async () => {
    const a = await run<{ scope: string; school: unknown; heroType: string; related: Story[] }>(ARTICLE_QUERY, { slug: "tailgate-rulebook" });
    expect(a).toMatchObject({ scope: "national", school: null, heroType: "none" });
    expect(a.related.map((r) => r.slug)).toEqual(["road-trip-best-part"]);
  });

  it("keeps national stories in feeds, search, and the sitemap at their national URLs", async () => {
    const idx = await run<{ u: string }[]>(SEARCH_INDEX_QUERY);
    expect(idx.map((i) => i.u)).toContain("/national/tailgate-rulebook");
    const sm = await run<{ articles: { path: string }[] }>(SITEMAP_QUERY);
    expect(sm.articles.map((a) => a.path)).toContain("/national/road-trip-best-part");
    const feed = await run<{ path: string }[]>(FEED_QUERY);
    expect(feed.map((i) => i.path)).toContain("/national/tailgate-rulebook");
    const ga = await run<{ items: { path: string }[] }>(SCHOOL_FEED_QUERY, { slug: "georgia" });
    expect(ga.items.map((i) => i.path)).toContain("/national/road-trip-best-part");
  });
});
