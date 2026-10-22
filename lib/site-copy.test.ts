import { describe, expect, it } from "vitest";
import { COPY_SPEC, fillCopy, resolveCopy, unknownTokens } from "./site-copy";

describe("resolveCopy", () => {
  it("returns every default when nothing is set", () => {
    const copy = resolveCopy(null);
    expect(copy.join.headerButton).toBe("Join the Club");
    expect(copy.footer.signoff).toBe(COPY_SPEC.footer.fields.signoff.default);
    for (const [section, { fields }] of Object.entries(COPY_SPEC)) {
      for (const key of Object.keys(fields)) {
        expect((copy as Record<string, Record<string, string>>)[section]?.[key]).toBeTruthy();
      }
    }
  });

  it("uses the editor's text and falls back for empty or blank fields", () => {
    const copy = resolveCopy({ join: { headerButton: "  Join free  ", cardButton: "   ", cardBody: null } });
    expect(copy.join.headerButton).toBe("Join free");
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
