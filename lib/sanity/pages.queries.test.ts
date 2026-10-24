import { describe, expect, it } from "vitest";
import { evaluate, parse } from "groq-js";
import { dataset } from "../../scripts/fixtures/dataset.mjs";
import {
  AUTHOR_QUERY,
  FEED_QUERY,
  HOME_PICKS_QUERY,
  HOME_QUERY,
  INFO_PAGE_QUERY,
  ARTICLE_QUERY,
  NATIONAL_FRONT_QUERY,
  NATIONAL_PICKS_QUERY,
  MEDIA_QUERY,
  SCHOOL_FEED_QUERY,
  SCHOOL_FRONT_QUERY,
  SCHOOL_PICKS_QUERY,
  SEARCH_INDEX_QUERY,
  SITEMAP_QUERY,
  SITE_SIGNALS_QUERY,
  TAG_QUERY,
} from "./queries";
import { pageQuery } from "./paginate";
import { selectFront } from "@/lib/fronts";

// Runs the page queries against the same fixture dataset the mock server and smoke tests use.

type Card = { _id: string; slug: string; contentType: string; school: { slug: string } | null };

async function run<T>(query: string, params: Record<string, unknown> = {}, data: unknown[] = dataset): Promise<T> {
  const value = await evaluate(parse(query, { params }), { dataset: data, params });
  return (await value.get()) as T;
}

type Front = { lead: Card | null; supporting: Card[]; latest: Card[]; media: Card[]; count: number; top: Card[] };

/** A front the way the views build it: picks, then the front query with the chosen ids, page N of Latest. */
async function front(picks: string, query: string, params: Record<string, unknown> = {}, page = 1, data: unknown[] = dataset): Promise<Front> {
  const { lead, supporting } = selectFront(await run<{ pinned: string | null; newest: string[] }>(picks, params, data));
  const r = await run<Omit<Front, "top">>(pageQuery(query, "[0...20]", page, 20), { ...params, lead: lead ?? "", supporting }, data);
  return { ...r, top: [r.lead, ...r.supporting].filter((c): c is Card => c !== null) };
}

/** The fixture with Site settings > Editorial > Homepage lead pointing at an article. */
const withLead = (articleId: string) =>
  (dataset as Array<{ _id: string }>).map((d) =>
    d._id === "siteSettings" ? { ...d, homepageLead: { _type: "reference", _ref: articleId, _weak: true } } : d,
  );

const live = (dataset as Array<{ _type: string; coverageScope?: string; primarySchool?: unknown; slug?: { current?: string } }>).filter(
  (d) => d._type === "article" && (d.coverageScope === "national" || d.primarySchool) && d.slug?.current,
);

describe("HOME_QUERY", () => {
  it("leads with the newest story and the three after it when nothing is curated", async () => {
    const home = await front(HOME_PICKS_QUERY, HOME_QUERY);
    expect(home.top.map((a) => a.slug)).toEqual([
      "tailgate-rulebook",
      "fourth-quarter-collapse-defensive-rotation",
      "healthy-line-ole-miss",
      "bye-week-mailbag",
    ]);
  });

  it("leads with the curated story, falls back when it is not live, and fills supporting with the newest", async () => {
    const curated = await front(HOME_PICKS_QUERY, HOME_QUERY, {}, 1, withLead("article-five-plays-georgia-texas"));
    expect(curated.top.map((a) => a.slug)).toEqual([
      "five-plays-georgia-texas",
      "tailgate-rulebook",
      "fourth-quarter-collapse-defensive-rotation",
      "healthy-line-ole-miss",
    ]);
    const missing = await front(HOME_PICKS_QUERY, HOME_QUERY, {}, 1, withLead("article-deleted"));
    expect(missing.lead?.slug).toBe("tailgate-rulebook");
  });

  it("uses the curated lead on a section front only when it belongs there", async () => {
    const national = await front(SCHOOL_PICKS_QUERY, SCHOOL_FRONT_QUERY, { slug: "georgia" }, 1, withLead("article-tailgate-rulebook"));
    expect(national.lead?.slug).toBe("fourth-quarter-collapse-defensive-rotation");
    const georgia = await front(SCHOOL_PICKS_QUERY, SCHOOL_FRONT_QUERY, { slug: "georgia" }, 1, withLead("article-five-plays-georgia-texas"));
    expect(georgia.lead?.slug).toBe("five-plays-georgia-texas");
    const onNational = await front(NATIONAL_PICKS_QUERY, NATIONAL_FRONT_QUERY, {}, 1, withLead("article-five-plays-georgia-texas"));
    expect(onNational.lead?.slug).toBe("tailgate-rulebook");
  });

  it("never repeats a top story in Latest, on any page, and pages cover every other story once", async () => {
    for (const data of [dataset, withLead("article-secondary-communication")]) {
      const home = await front(HOME_PICKS_QUERY, HOME_QUERY, {}, 1, data);
      const page2 = await front(HOME_PICKS_QUERY, HOME_QUERY, {}, 2, data);
      const topIds = new Set(home.top.map((a) => a._id));
      const seen = [...home.latest, ...page2.latest].map((a) => a._id);
      expect(seen.some((id) => topIds.has(id))).toBe(false);
      expect(new Set(seen).size).toBe(seen.length);
      expect(seen.length + home.top.length).toBe(home.count);
      expect(home.count).toBe(live.length);
    }
  });

  it("lists recent podcasts and videos for the rail, never repeating a top story", async () => {
    const home = await front(HOME_PICKS_QUERY, HOME_QUERY);
    expect(home.media).toHaveLength(4);
    expect(home.media.every((a) => a.contentType === "podcast" || a.contentType === "video")).toBe(true);
    const topIds = new Set(home.top.map((a) => a._id));
    expect(home.media.some((a) => topIds.has(a._id))).toBe(false);
    const ga = await front(SCHOOL_PICKS_QUERY, SCHOOL_FRONT_QUERY, { slug: "georgia" });
    const gaTop = new Set(ga.top.map((a) => a._id));
    expect(ga.media.length).toBeGreaterThan(0);
    expect(ga.media.some((a) => gaTop.has(a._id))).toBe(false);
  });
});

describe("SCHOOL_FRONT_QUERY", () => {
  it("scopes everything to the school and returns curated tags in order", async () => {
    const s = await front(SCHOOL_PICKS_QUERY, SCHOOL_FRONT_QUERY, { slug: "alabama" });
    // Two Alabama-listed stories: the cross-listed lead and the Alabama-only one.
    expect(s.count).toBe(2);
    expect(s.top).toHaveLength(2);
    expect(s.latest).toHaveLength(0);
    const ga = await front(SCHOOL_PICKS_QUERY, SCHOOL_FRONT_QUERY, { slug: "georgia" });
    expect((ga as unknown as { navTags: { slug: string }[] }).navTags.map((t) => t.slug)).toEqual(["recruiting", "quarterbacks", "defense", "film-room", "portal", "basketball"]);
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
    const nat = await front(NATIONAL_PICKS_QUERY, NATIONAL_FRONT_QUERY);
    const all = [...nat.top, ...nat.latest] as unknown as Story[];
    expect(all.map((a) => a.slug).sort()).toEqual(["road-trip-best-part", "tailgate-rulebook"]);
    expect(nat.count).toBe(2);
    for (const a of all) {
      expect(a.scope).toBe("national");
      expect(a.school).toBeNull();
      expect(a.path).toBe(`/national/${a.slug}`);
    }
  });

  it("shows a national story on a school front it is associated with, still linking to /national", async () => {
    const ga = await front(SCHOOL_PICKS_QUERY, SCHOOL_FRONT_QUERY, { slug: "georgia" });
    const roadTrip = ([...ga.top, ...ga.latest] as unknown as Story[]).find((a) => a.slug === "road-trip-best-part");
    expect(roadTrip?.path).toBe("/national/road-trip-best-part");
    const bama = await front(SCHOOL_PICKS_QUERY, SCHOOL_FRONT_QUERY, { slug: "alabama" });
    expect(([...bama.top, ...bama.latest] as unknown as Story[]).some((a) => a.scope === "national")).toBe(false);
  });

  it("treats school stories saved before coverageScope existed as school stories", async () => {
    const home = await front(HOME_PICKS_QUERY, HOME_QUERY);
    expect(home.top[1]).toMatchObject({ scope: "school", path: "/georgia/fourth-quarter-collapse-defensive-rotation" });
  });

  it("loads a text-only national article with national related stories", async () => {
    const a = await run<{ scope: string; school: unknown; heroType: string; related: Story[]; openClub: string | null }>(ARTICLE_QUERY, {
      slug: "tailgate-rulebook",
    });
    expect(a).toMatchObject({ scope: "national", school: null, heroType: "none", openClub: "Dawg Social Club" });
    // Read next is the other national story; More to read fills with the newest.
    expect(a.related.map((r) => r.slug)[0]).toBe("road-trip-best-part");
    expect(a.related).toHaveLength(3);
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
