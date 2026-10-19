import { describe, expect, it } from "vitest";
import { evaluate, parse } from "groq-js";
import { dataset } from "./fixtures/dataset.mjs";
import { ALT_TEXT_QUERY, report } from "./check-alt-text.mjs";

const run = async (docs) => (await evaluate(parse(ALT_TEXT_QUERY), { dataset: docs })).get();
const img = (alt) => ({ _type: "image", asset: { _ref: "image-abc-10x10-jpg", _type: "reference" }, ...(alt === undefined ? {} : { alt }) });

describe("check-alt-text", () => {
  it("passes the fixture dataset", async () => {
    expect(await run(dataset)).toEqual([]);
  });

  it("flags every kind of image without alt, and ignores drafts and empty image fields", async () => {
    const problems = await run([
      { _id: "a1", _type: "article", title: "Body", body: [{ _type: "block" }, { ...img(""), _type: "imageBlock" }] },
      { _id: "a2", _type: "article", title: "Hero", heroImage: img(undefined) },
      { _id: "a3", _type: "article", title: "OG", ogImageOverride: img(undefined) },
      { _id: "a4", _type: "article", title: "Fine", heroImage: img("A tackle"), ogImageOverride: { _type: "image" } },
      { _id: "drafts.a5", _type: "article", title: "Draft", heroImage: img(undefined) },
      { _id: "p1", _type: "infoPage", title: "About", body: [{ ...img(undefined), _type: "imageBlock" }] },
      { _id: "au1", _type: "author", name: "Jon", photo: img(undefined) },
      { _id: "s1", _type: "school", name: "Georgia", logo: img(undefined) },
      { _id: "sp1", _type: "sponsorSlot", sponsorName: "Acme", logo: img(undefined) },
      { _id: "siteSettings", _type: "siteSettings", defaultOgImage: img(undefined) },
    ]);
    expect(problems.map((p) => p._id).sort()).toEqual(["a1", "a2", "a3", "au1", "p1", "s1", "siteSettings", "sp1"]);
  });

  it("reports the documents to fix", () => {
    expect(report([]).ok).toBe(true);
    const r = report([{ _id: "a1", _type: "article", label: "Body" }]);
    expect(r.ok).toBe(false);
    expect(r.text).toContain('article "Body" (a1)');
  });
});
