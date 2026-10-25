import { describe, expect, it } from "vitest";
import { closingPeriod, COPY_SPEC, fillCopy, resolveCopy, unknownTokens } from "./site-copy";

describe("resolveCopy", () => {
  it("fills the comment count line", () => {
    const copy = resolveCopy(null);
    expect(fillCopy(copy.join.articleLeadWithCount, { count: "12 comments", community: "Dawg Social Club" })).toBe("12 comments so far in Dawg Social Club.");
    expect(unknownTokens(copy.join.articleLeadWithCount, ["count", "community"])).toEqual([]);
  });

  it("uses edited community and national copy, and keeps defaults for blank fields", () => {
    const copy = resolveCopy({ community: { heading: "Pick your club.", joinButton: "Join the {community} crew", intro: " " }, national: { heading: "Across the country" } });
    expect(copy.community.heading).toBe("Pick your club.");
    expect(fillCopy(copy.community.joinButton, { community: "Dawg Social Club" })).toBe("Join the Dawg Social Club crew");
    expect(copy.community.intro).toBe(COPY_SPEC.community.fields.intro.default);
    expect(copy.national).toEqual({ kicker: "College sports", heading: "Across the country" });
  });

  it("returns every default when nothing is set", () => {
    const copy = resolveCopy(null);
    expect(copy.newsletter.headerButton).toBe("Newsletter");
    expect(copy.footer.signoff).toBe(COPY_SPEC.footer.fields.signoff.default);
    for (const [section, { fields }] of Object.entries(COPY_SPEC)) {
      for (const key of Object.keys(fields)) {
        expect((copy as Record<string, Record<string, string>>)[section]?.[key]).toBeTruthy();
      }
    }
  });

  it("uses the editor's text and falls back for empty or blank fields", () => {
    const copy = resolveCopy({ join: { cardButton: "   ", cardBody: null }, newsletter: { headerButton: "  Subscribe  " } });
    expect(copy.newsletter.headerButton).toBe("Subscribe");
    expect(copy.join.cardButton).toBe("Join free");
    expect(copy.join.cardBody).toBe(COPY_SPEC.join.fields.cardBody.default);
    expect(copy.newsletter.button).toBe("Sign up");
  });
});

describe("fillCopy", () => {
  it("fills known tokens and leaves unknown ones visible", () => {
    expect(fillCopy("Discuss in {community}", { community: "Dawg Social Club" })).toBe("Discuss in Dawg Social Club");
    expect(fillCopy("Want to cover {school}? {oops}", { school: "Georgia" })).toBe("Want to cover Georgia? {oops}");
  });
});

describe("unknownTokens", () => {
  it("flags tokens a field does not support", () => {
    expect(unknownTokens("Join {community}", ["community"])).toEqual([]);
    expect(unknownTokens("Join {school}", ["community"])).toEqual(["school"]);
    expect(unknownTokens("Join free")).toEqual([]);
  });

  it("matches the tokens each default uses", () => {
    for (const { fields } of Object.values(COPY_SPEC)) {
      for (const entry of Object.values(fields) as Array<{ default: string; tokens?: readonly ("community" | "school")[] }>) {
        expect(unknownTokens(entry.default, entry.tokens)).toEqual([]);
      }
    }
  });
});

describe("length limits", () => {
  it("fit every default", () => {
    for (const { fields } of Object.values(COPY_SPEC)) {
      for (const entry of Object.values(fields) as Array<{ default: string; long?: boolean; max?: number }>) {
        expect(entry.default.length).toBeLessThanOrEqual(entry.max ?? (entry.long ? 300 : 90));
      }
    }
  });
});

describe("closingPeriod", () => {
  it("adds a period unless the link text already ends the sentence", () => {
    expect(closingPeriod("Write for Speakeasy")).toBe(".");
    expect(closingPeriod("Write for us!")).toBe("");
    expect(closingPeriod("Read a sample issue. ")).toBe("");
  });
});
