import { describe, expect, it } from "vitest";
import { selectFront } from "./fronts";

describe("selectFront", () => {
  it("leads with the newest story when nothing is curated", () => {
    expect(selectFront({ pinned: null, newest: ["a", "b", "c", "d"] })).toEqual({ lead: "a", supporting: ["b", "c", "d"] });
  });
  it("leads with the curated story and keeps three supporting stories without repeating it", () => {
    expect(selectFront({ pinned: "c", newest: ["a", "b", "c", "d"] })).toEqual({ lead: "c", supporting: ["a", "b", "d"] });
    expect(selectFront({ pinned: "z", newest: ["a", "b", "c", "d"] })).toEqual({ lead: "z", supporting: ["a", "b", "c"] });
  });
  it("handles thin and empty fronts", () => {
    expect(selectFront({ pinned: null, newest: ["a"] })).toEqual({ lead: "a", supporting: [] });
    expect(selectFront({ pinned: null, newest: [] })).toEqual({ lead: null, supporting: [] });
    expect(selectFront(null)).toEqual({ lead: null, supporting: [] });
  });
});
