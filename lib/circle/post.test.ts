import { describe, expect, it } from "vitest";
import { buildPostContent, postBodyHtml } from "./post";

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
      imageUrl: "https://cdn.sanity.io/images/p/d/abc.jpg?w=1200&h=630&fit=crop&auto=format",
    });
  });
  it("explains what is missing", () => {
    expect(buildPostContent({ ...base, school: { slug: "georgia", circleSpaceId: null } })).toEqual({ error: "Primary school has no Circle space id" });
    expect(buildPostContent({ ...base, slug: null })).toEqual({ error: "Article or primary school has no slug" });
  });
  it("escapes the dek in the post body", () => {
    const c = buildPostContent(base);
    if ("error" in c) throw new Error("unexpected");
    expect(postBodyHtml(c)).toBe(
      '<p>Tom &amp; Jerry &lt;script&gt;</p><p>Read the full story: <a href="https://speakeasysports.com/georgia/healthy-line">https://speakeasysports.com/georgia/healthy-line</a></p>',
    );
  });
});
