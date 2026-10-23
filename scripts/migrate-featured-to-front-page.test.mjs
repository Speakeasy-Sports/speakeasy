import { describe, expect, it } from "vitest";
import { evaluate, parse } from "groq-js";
import { chunk, FEATURED_QUERY, OLD_FIELDS_QUERY, planPicks } from "./migrate-featured-to-front-page.mjs";

const article = (id, extra) => ({
  _id: id,
  _type: "article",
  title: id,
  slug: { current: id },
  primarySchool: { _type: "reference", _ref: "school-georgia" },
  ...extra,
});
const run = async (query, docs) => (await evaluate(parse(query), { dataset: docs })).get();

describe("migrate-featured-to-front-page", () => {
  const docs = [
    article("rank2", { featured: true, featuredRank: 2, publishedAt: "2026-10-20T00:00:00Z" }),
    article("rank1-old", { featured: true, featuredRank: 1, publishedAt: "2026-10-18T00:00:00Z" }),
    article("rank1-new", { featured: true, featuredRank: 1, publishedAt: "2026-10-19T00:00:00Z" }),
    article("rank4", { featured: true, featuredRank: 4, publishedAt: "2026-10-10T00:00:00Z" }),
    article("rank3", { featured: true, featuredRank: 3, publishedAt: "2026-10-11T00:00:00Z" }),
    article("unflagged", { featured: false, featuredRank: 1 }),
    article("plain", {}),
    { _id: "no-school", _type: "article", slug: { current: "x" }, featured: true, featuredRank: 1 },
  ];

  it("orders picks the way the old front page did: rank, then newest on a tie, four at most", async () => {
    const featured = await run(FEATURED_QUERY, docs);
    const picks = planPicks(featured);
    expect(picks.map((p) => p._ref)).toEqual(["rank1-new", "rank1-old", "rank2", "rank3"]);
    expect(picks.every((p) => p._weak && p._type === "reference")).toBe(true);
    expect(new Set(picks.map((p) => p._key)).size).toBe(4);
  });

  it("finds every article still carrying the old fields", async () => {
    const ids = await run(OLD_FIELDS_QUERY, docs);
    expect(ids).toHaveLength(7);
    expect(ids).not.toContain("plain");
  });

  it("batches patches", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});
