import { describe, expect, it } from "vitest";
import { buildPostContent, postBodyDoc } from "./post";

const base = {
  _id: "a1",
  title: "Healthy line",
  dek: "Tom & Jerry <script>",
  slug: "healthy-line",
  circlePostId: null,
  school: { slug: "georgia", circleSpaceId: "123" },
  heroImageUrl: "https://cdn.sanity.io/images/p/d/abc.jpg",
};

describe("buildPostContent", () => {
  it("links to the canonical article and never includes the body", () => {
    const c = buildPostContent(base);
    expect(c).toEqual({
      spaceId: "123",
      title: "Healthy line",
      dek: "Tom & Jerry <script>",
      url: "https://speakeasysports.com/georgia/healthy-line",
      imageUrl: "https://cdn.sanity.io/images/p/d/abc.jpg?w=1200&h=630&fit=crop&fm=jpg&q=80",
    });
  });
  it("explains what is missing", () => {
    expect(buildPostContent({ ...base, school: { slug: "georgia", circleSpaceId: null } })).toEqual({ error: "Primary school has no Circle space id" });
    expect(buildPostContent({ ...base, slug: null })).toEqual({ error: "Article or primary school has no slug" });
  });
  it("builds a TipTap body with the dek and a link, text never parsed as markup", () => {
    const c = buildPostContent(base);
    if ("error" in c) throw new Error("unexpected");
    const url = "https://speakeasysports.com/georgia/healthy-line";
    expect(postBodyDoc(c)).toEqual({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Tom & Jerry <script>" }] },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Read the full story: " },
            { type: "text", text: url, marks: [{ type: "link", attrs: { href: url, target: "_blank" } }] },
          ],
        },
      ],
    });
    expect(postBodyDoc({ ...c, dek: "" }).content).toHaveLength(1);
  });
});
