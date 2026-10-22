import { describe, expect, it } from "vitest";
import { evaluate, parse } from "groq-js";
import {
  ARTICLE_OG_QUERY,
  ARTICLE_QUERY,
  ARTICLE_SLUGS_QUERY,
  HOME_QUERY,
  SCHOOL_FRONT_QUERY,
  SITE_SETTINGS_QUERY,
} from "./queries";

// Runs the real GROQ against an in-memory dataset. This is the published perspective: every document here is live.
// Drafts never appear in this perspective, so there are none in the fixture.

const ref = (id: string) => ({ _type: "reference", _ref: id });
const school = (id: string, slug: string) => ({
  _id: id,
  _type: "school",
  name: slug,
  shortName: slug,
  slug: { current: slug },
  communityName: `${slug} club`,
  accentColor: "#BA0C2F",
});
const article = (
  id: string,
  slug: string,
  opts: { publishedAt?: string; status?: string; tags?: string[]; schools?: string[]; primary?: string } = {},
) => ({
  _id: id,
  _type: "article",
  _createdAt: "2026-01-01T00:00:00Z",
  title: slug,
  dek: `${slug} dek`,
  slug: { current: slug },
  contentType: "analysis",
  heroType: "image",
  status: opts.status ?? "published",
  publishedAt: opts.publishedAt,
  schools: (opts.schools ?? ["georgia"]).map((s) => ref(`school-${s}`)),
  primarySchool: ref(`school-${opts.primary ?? opts.schools?.[0] ?? "georgia"}`),
  authors: [ref("author-jon")],
  tags: opts.tags?.map((t) => ref(`tag-${t}`)),
});

const NOW = "2026-10-19T12:00:00Z";
const dataset = [
  school("school-georgia", "georgia"),
  school("school-alabama", "alabama"),
  { _id: "author-jon", _type: "author", name: "Jon", slug: { current: "jon" } },
  { _id: "tag-defense", _type: "tag", name: "Defense", slug: { current: "defense" } },
  { _id: "tag-qb", _type: "tag", name: "QB", slug: { current: "qb" } },
  { _id: "siteSettings", _type: "siteSettings", siteName: "Speakeasy", navSchools: [ref("school-georgia")] },

  // Subject article: two tags.
  article("a-subject", "subject", { publishedAt: "2026-10-18T00:00:00Z", tags: ["defense", "qb"], schools: ["georgia", "alabama"] }),
  // Candidates for related: shares both tags (oldest), shares one (newer), none (newest).
  article("a-both", "both-tags", { publishedAt: "2026-10-10T00:00:00Z", tags: ["defense", "qb"] }),
  article("a-one", "one-tag", { publishedAt: "2026-10-15T00:00:00Z", tags: ["qb"] }),
  article("a-none", "no-tags", { publishedAt: "2026-10-17T00:00:00Z" }),
  // Other school, must never relate to a Georgia article.
  article("a-bama", "bama-story", { publishedAt: "2026-10-16T00:00:00Z", tags: ["defense", "qb"], schools: ["alabama"] }),
  // Status still "review" after a publish, before the webhook flips it. Must be live.
  article("a-review", "review-status", { publishedAt: "2026-10-19T00:00:00Z", status: "review" }),
  // No publishedAt yet: falls back to _createdAt for ordering, still live.
  article("a-nodate", "no-date", {}),
  // Unusable: no primary school.
  { _id: "a-broken", _type: "article", title: "broken", slug: { current: "broken" }, status: "published" },

  // Sponsor slots
  { _id: "s-all", _type: "sponsorSlot", _updatedAt: "2026-10-01T00:00:00Z", active: true, placement: "articleBelowHero", sponsorName: "All schools", url: "https://a.example" },
  { _id: "s-bama", _type: "sponsorSlot", _updatedAt: "2026-10-05T00:00:00Z", active: true, placement: "articleBelowHero", sponsorName: "Bama only", url: "https://b.example", schools: [ref("school-alabama")] },
  { _id: "s-expired", _type: "sponsorSlot", _updatedAt: "2026-10-09T00:00:00Z", active: true, placement: "articleBelowHero", sponsorName: "Expired", url: "https://c.example", endDate: "2026-09-01T00:00:00Z" },
  { _id: "s-future", _type: "sponsorSlot", _updatedAt: "2026-10-09T00:00:00Z", active: true, placement: "articleBelowHero", sponsorName: "Future", url: "https://d.example", startDate: "2027-01-01T00:00:00Z" },
  { _id: "s-inactive", _type: "sponsorSlot", _updatedAt: "2026-10-09T00:00:00Z", active: false, placement: "articleBelowHero", sponsorName: "Inactive", url: "https://e.example" },
  { _id: "s-newsletter", _type: "sponsorSlot", _updatedAt: "2026-10-09T00:00:00Z", active: true, placement: "newsletter", sponsorName: "Newsletter", url: "https://f.example" },
];

async function run<T = unknown>(query: string, params: Record<string, unknown> = {}): Promise<T> {
  const value = await evaluate(parse(query), { dataset, params, timestamp: new Date(NOW) });
  return (await value.get()) as T;
}

type Card = { _id: string; slug: string; school: { slug: string } | null };

describe("HOME_QUERY", () => {
  it("with no picks, tops the page with the four newest, then lists the rest, regardless of status", async () => {
    const home = await run<{ top: Card[]; latest: Card[]; count: number }>(HOME_QUERY);
    expect(home.top.map((r) => r._id)).toEqual(["a-review", "a-subject", "a-none", "a-bama"]);
    expect(home.latest.map((r) => r._id)).toEqual(["a-one", "a-both", "a-nodate"]);
    expect(home.count).toBe(7);
    expect([...home.top, ...home.latest].find((r) => r._id === "a-broken")).toBeUndefined();
  });
});

describe("SCHOOL_FRONT_QUERY", () => {
  it("includes articles that list the school as primary or secondary", async () => {
    const s = await run<{ top: Card[]; latest: Card[] }>(SCHOOL_FRONT_QUERY, { slug: "alabama" });
    expect([...s.top, ...s.latest].map((r) => r._id)).toEqual(["a-subject", "a-bama"]);
  });
});

// Front page picks (AGENTS.md section 6): run the same queries with a Front page document and school picks added.
const weak = (id: string) => ({ _type: "reference", _ref: id, _weak: true, _key: id });
async function runWith<T>(extra: object[], query: string, params: Record<string, unknown> = {}, replace: Record<string, object> = {}) {
  const docs = [...dataset.map((d) => replace[(d as { _id: string })._id] ?? d), ...extra];
  const value = await evaluate(parse(query), { dataset: docs, params, timestamp: new Date(NOW) });
  return (await value.get()) as T;
}
const frontPage = (...ids: string[]) => ({ _id: "frontPage", _type: "frontPage", topStories: ids.map(weak) });

describe("front page picks", () => {
  it("leads with the picks in order, fills with the newest, and never repeats them in Latest", async () => {
    const home = await runWith<{ top: Card[]; latest: Card[]; count: number }>([frontPage("a-both", "a-nodate")], HOME_QUERY);
    expect(home.top.map((r) => r._id)).toEqual(["a-both", "a-nodate", "a-review", "a-subject"]);
    expect(home.latest.map((r) => r._id)).toEqual(["a-none", "a-bama", "a-one"]);
    expect(home.top.length + home.latest.length).toBe(home.count);
  });

  it("skips picks that are missing, unpublished, or not usable", async () => {
    const home = await runWith<{ top: Card[] }>([frontPage("a-missing", "a-broken", "a-one")], HOME_QUERY);
    expect(home.top.map((r) => r._id)).toEqual(["a-one", "a-review", "a-subject", "a-none"]);
  });

  it("uses a school's own picks, dropping any that do not cover the school", async () => {
    const bama = { ...school("school-alabama", "alabama"), topStories: [weak("a-one"), weak("a-bama")] };
    const s = await runWith<{ top: Card[]; latest: Card[] }>(
      [frontPage("a-subject")],
      SCHOOL_FRONT_QUERY,
      { slug: "alabama" },
      { "school-alabama": bama },
    );
    // a-one is a Georgia story, so it is skipped; the home pick is ignored because Alabama has picks of its own.
    expect(s.top.map((r) => r._id)).toEqual(["a-bama", "a-subject"]);
    expect(s.latest).toEqual([]);
  });

  it("keeps a school's own picks out of its Latest list", async () => {
    const ga = { ...school("school-georgia", "georgia"), topStories: [weak("a-both"), weak("a-one")] };
    const s = await runWith<{ top: Card[]; latest: Card[] }>([], SCHOOL_FRONT_QUERY, { slug: "georgia" }, { "school-georgia": ga });
    expect(s.top.map((r) => r._id)).toEqual(["a-both", "a-one", "a-review", "a-subject"]);
    expect(s.latest.map((r) => r._id)).toEqual(["a-none", "a-nodate"]);
  });

  it("inherits the home page's picks that cover a school with no picks of its own", async () => {
    const s = await runWith<{ top: Card[]; latest: Card[] }>([frontPage("a-bama", "a-nodate")], SCHOOL_FRONT_QUERY, { slug: "georgia" });
    // a-bama is not a Georgia story, so only a-nodate carries over; the rest are the newest Georgia stories.
    expect(s.top.map((r) => r._id)).toEqual(["a-nodate", "a-review", "a-subject", "a-none"]);
    expect(s.latest.map((r) => r._id)).toEqual(["a-one", "a-both"]);
  });
});

describe("ARTICLE_QUERY", () => {
  it("resolves references and expands the article", async () => {
    const a = await run<{ title: string; school: { slug: string }; schools: { slug: string }[]; authors: { name: string }[]; tags: { slug: string }[] }>(
      ARTICLE_QUERY,
      { slug: "subject" },
    );
    expect(a.school.slug).toBe("georgia");
    expect(a.schools.map((s) => s.slug)).toEqual(["georgia", "alabama"]);
    expect(a.authors[0]?.name).toBe("Jon");
    expect(a.tags.map((t) => t.slug)).toEqual(["defense", "qb"]);
  });

  it("returns live articles whose status was not flipped yet", async () => {
    const a = await run<{ _id: string } | null>(ARTICLE_QUERY, { slug: "review-status" });
    expect(a?._id).toBe("a-review");
  });

  it("orders related by shared tags, then date, same primary school only", async () => {
    const a = await run<{ related: Card[] }>(ARTICLE_QUERY, { slug: "subject" });
    // Two shared tags, then one, then the newest untagged Georgia story. Never the Alabama story.
    expect(a.related.map((r) => r._id)).toEqual(["a-both", "a-one", "a-review"]);
  });

  it("falls back to most recent same-school stories for an untagged article", async () => {
    const a = await run<{ related: Card[] }>(ARTICLE_QUERY, { slug: "no-tags" });
    expect(a.related.map((r) => r._id)).toEqual(["a-review", "a-subject", "a-one"]);
  });

  it("picks the sponsor that is active, in date, and matches the school", async () => {
    const georgia = await run<{ sponsor: { _id: string } | null }>(ARTICLE_QUERY, { slug: "subject" });
    expect(georgia.sponsor?._id).toBe("s-all");
    const bama = await run<{ sponsor: { _id: string } | null }>(ARTICLE_QUERY, { slug: "bama-story" });
    expect(bama.sponsor?._id).toBe("s-bama");
  });

  it("returns null for unknown or unusable slugs", async () => {
    expect(await run(ARTICLE_QUERY, { slug: "nope" })).toBeNull();
    expect(await run(ARTICLE_QUERY, { slug: "broken" })).toBeNull();
  });
});

describe("ARTICLE_OG_QUERY and slugs", () => {
  it("agrees with the article page on what is live", async () => {
    const og = await run<{ title: string; school: { slug: string } } | null>(ARTICLE_OG_QUERY, { slug: "review-status" });
    expect(og?.school.slug).toBe("georgia");
    const slugs = await run<{ slug: string; school: string }[]>(ARTICLE_SLUGS_QUERY);
    expect(slugs).toContainEqual({ slug: "review-status", school: "georgia" });
    expect(slugs.find((s) => s.slug === "broken")).toBeUndefined();
  });
});

describe("SCHOOL_FRONT_QUERY and SITE_SETTINGS_QUERY", () => {
  it("resolve by slug and singleton id", async () => {
    const s = await run<{ _id: string } | null>(SCHOOL_FRONT_QUERY, { slug: "georgia" });
    expect(s?._id).toBe("school-georgia");
    const settings = await run<{ siteName: string; navSchools: { slug: string }[] }>(SITE_SETTINGS_QUERY);
    expect(settings.navSchools[0]?.slug).toBe("georgia");
  });
});
