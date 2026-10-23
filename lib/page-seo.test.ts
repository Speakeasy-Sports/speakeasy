import { describe, expect, it } from "vitest";
import { pageSeo } from "./page-seo";

describe("pageSeo", () => {
  it("returns trimmed values, or null when empty", () => {
    expect(pageSeo({ home: { title: " Speakeasy Sports ", description: "  " } }, "home")).toEqual({
      title: "Speakeasy Sports",
      description: null,
    });
    expect(pageSeo(null, "podcasts")).toEqual({ title: null, description: null });
  });
});
