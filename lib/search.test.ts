import { describe, expect, it } from "vitest";
import { highlight, search, tokens, type IndexEntry } from "./search";

const e = (t: string, extra: Partial<IndexEntry> = {}): IndexEntry => ({
  t,
  d: null,
  u: `/georgia/${t.toLowerCase().replace(/\W+/g, "-")}`,
  s: "Georgia",
  k: "analysis",
  a: ["Jon Smith"],
  g: [],
  p: "2026-10-01T00:00:00Z",
  ...extra,
});

const index = [
  e("Quarterback depth chart, explained", { g: ["Quarterbacks"], p: "2026-10-10T00:00:00Z" }),
  e("Recruiting board for Florida weekend", { g: ["Recruiting"], a: ["Avery Collins"], p: "2026-10-12T00:00:00Z" }),
  e("Defense rotation analysis", { d: "The quarterback pressure numbers", p: "2026-10-15T00:00:00Z" }),
  e("Café culture in Athens", { k: "feature" }),
];

describe("search", () => {
  it("requires every token and ranks title matches above dek matches", () => {
    const hits = search(index, "quarterback");
    expect(hits.map((h) => h.entry.t)).toEqual(["Quarterback depth chart, explained", "Defense rotation analysis"]);
    expect(search(index, "quarterback florida")).toHaveLength(0);
  });

  it("matches authors, tags, and accents", () => {
    expect(search(index, "avery")[0]?.entry.t).toBe("Recruiting board for Florida weekend");
    expect(search(index, "cafe")[0]?.entry.t).toBe("Café culture in Athens");
  });

  it("ignores empty and one-letter queries", () => {
    expect(search(index, "")).toHaveLength(0);
    expect(search(index, "a")).toHaveLength(0);
    expect(tokens("  QB  room!! ")).toEqual(["qb", "room"]);
  });

  it("highlights matched runs", () => {
    expect(highlight("Quarterback depth", "quarter")).toEqual([
      { text: "Quarter", match: true },
      { text: "back depth", match: false },
    ]);
  });
});
