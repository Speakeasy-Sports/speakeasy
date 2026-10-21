import { describe, expect, it } from "vitest";
import { deriveSignals } from "./site-signals";

describe("deriveSignals", () => {
  it("hides media links and bylines at launch", () => {
    expect(deriveSignals({ articles: 5, podcasts: 0, videos: 0, authors: 1 })).toEqual({ hasPodcasts: false, hasVideos: false, singleAuthor: true });
    expect(deriveSignals(null)).toEqual({ hasPodcasts: false, hasVideos: false, singleAuthor: true });
  });
  it("turns each one back on as content arrives", () => {
    expect(deriveSignals({ articles: 30, podcasts: 1, videos: 2, authors: 2 })).toEqual({ hasPodcasts: true, hasVideos: true, singleAuthor: false });
  });
});
