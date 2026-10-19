import { describe, expect, it } from "vitest";
import { buildReviewEmail, studioEditUrl } from "./review";

describe("buildReviewEmail", () => {
  it("names the story, byline, and a Studio link", () => {
    const e = buildReviewEmail("ed@example.com", "https://speakeasysports.com", {
      id: "a1",
      title: "Healthy line",
      dek: "The dek",
      authors: ["Jon Smith", null],
      school: "Georgia",
    });
    expect(e.subject).toBe("Ready for review: Healthy line");
    expect(e.text).toContain("By: Jon Smith\nSchool: Georgia\nDek: The dek");
    expect(e.text).toContain("https://speakeasysports.com/studio/intent/edit/id=a1;type=article");
    expect(e.text).not.toMatch(/—/);
  });
  it("handles a bare draft", () => {
    const e = buildReviewEmail("ed@example.com", "https://x.test", { id: "a1", title: null, dek: null, authors: null, school: null });
    expect(e.subject).toBe("Ready for review: Untitled story");
    expect(e.text).toBe(`"Untitled story" is ready for review.\n\nOpen in the Studio: ${studioEditUrl("https://x.test", "a1")}`);
  });
});
