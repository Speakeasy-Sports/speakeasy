import { describe, expect, it } from "vitest";
import { isDraftOrVersion, isReviewTransition, parsePayload, tagsForChange } from "./sanity-payload";

const article = (over: Record<string, unknown> = {}) =>
  parsePayload({ _id: "a1", _type: "article", operation: "update", slug: "story", status: "published", ...over })!;

describe("parsePayload", () => {
  it("rejects bodies without an id and type", () => {
    expect(parsePayload(null)).toBeNull();
    expect(parsePayload({ _type: "article" })).toBeNull();
    expect(parsePayload("x")).toBeNull();
  });
  it("normalizes unknown values", () => {
    const p = parsePayload({ _id: "a", _type: "article", operation: "weird", textChanged: "yes" })!;
    expect(p.operation).toBeNull();
    expect(p.textChanged).toBe(false);
    expect(p.slug).toBeNull();
  });
});

describe("tagsForChange", () => {
  it("revalidates both the new and old slug when an article slug changes", () => {
    expect(tagsForChange(article({ previousSlug: "old-story" }))).toEqual([
      "article-slug:story",
      "article-slug:old-story",
      "articles",
      "home",
    ]);
  });
  it("covers every content type in the tag table", () => {
    expect(tagsForChange(parsePayload({ _id: "s", _type: "school", slug: "georgia" })!)).toEqual([
      "school:georgia",
      "schools",
      "articles",
      "home",
    ]);
    expect(tagsForChange(parsePayload({ _id: "x", _type: "author", slug: "jon" })!)).toEqual(["author:jon", "authors", "articles"]);
    expect(tagsForChange(parsePayload({ _id: "x", _type: "tag", slug: "portal" })!)).toEqual(["tag:portal", "taxonomy", "articles"]);
    expect(tagsForChange(parsePayload({ _id: "x", _type: "infoPage", slug: "about" })!)).toEqual(["page:about", "pages"]);
    expect(tagsForChange(parsePayload({ _id: "x", _type: "siteSettings" })!)).toEqual(["settings"]);
    expect(tagsForChange(parsePayload({ _id: "frontPage", _type: "frontPage" })!)).toEqual(["home", "schools"]);
    expect(tagsForChange(parsePayload({ _id: "x", _type: "sponsorSlot" })!)).toEqual(["sponsors"]);
    expect(tagsForChange(parsePayload({ _id: "x", _type: "sanity.imageAsset" })!)).toEqual([]);
  });
});

describe("review transition", () => {
  it("fires only when status moves into review", () => {
    expect(isReviewTransition(article({ _id: "drafts.a1", status: "review", previousStatus: "draft" }))).toBe(true);
    expect(isReviewTransition(article({ _id: "drafts.a1", status: "review", previousStatus: null }))).toBe(true);
    expect(isReviewTransition(article({ _id: "drafts.a1", status: "review", previousStatus: "review" }))).toBe(false);
    expect(isReviewTransition(article({ _id: "drafts.a1", status: "scheduled", previousStatus: "review" }))).toBe(false);
    expect(isReviewTransition(article({ _id: "drafts.a1", status: "review", operation: "delete" }))).toBe(false);
  });
  it("recognizes drafts and release versions", () => {
    expect(isDraftOrVersion("drafts.a1")).toBe(true);
    expect(isDraftOrVersion("versions.r1.a1")).toBe(true);
    expect(isDraftOrVersion("a1")).toBe(false);
  });
});
