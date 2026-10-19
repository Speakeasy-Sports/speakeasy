import { describe, expect, it } from "vitest";
import { extractIds, secretMatches } from "./circle-payload";

const q = (s = "") => new URLSearchParams(s);

describe("extractIds", () => {
  it("finds a post id in the common shapes", () => {
    expect(extractIds({ post_id: 12 }, q()).postId).toBe("12");
    expect(extractIds({ post: { id: "12" } }, q()).postId).toBe("12");
    expect(extractIds({ data: { comment: { post_id: 12 } } }, q()).postId).toBe("12");
    expect(extractIds({ resource_type: "Post", resource_id: 12 }, q()).postId).toBe("12");
    expect(extractIds(null, q("post_id=12")).postId).toBe("12");
  });
  it("falls back to a comment id", () => {
    expect(extractIds({ comment: { id: 5 } }, q())).toEqual({ postId: null, commentId: "5" });
    expect(extractIds({ record_type: "Comment", record_id: "5" }, q())).toEqual({ postId: null, commentId: "5" });
  });
  it("ignores non-numeric ids and junk", () => {
    expect(extractIds({ post_id: "12; drop" }, q())).toEqual({ postId: null, commentId: null });
    expect(extractIds("text", q())).toEqual({ postId: null, commentId: null });
  });
});

describe("secretMatches", () => {
  const req = (headers: Record<string, string>, url = "https://x.test/api/webhooks/circle") => ({ headers: new Headers(headers), url });
  it("accepts the secret in a header, a bearer token, or the query", () => {
    expect(secretMatches(req({ "x-webhook-secret": "s3cret" }), "s3cret")).toBe(true);
    expect(secretMatches(req({ authorization: "Bearer s3cret" }), "s3cret")).toBe(true);
    expect(secretMatches(req({}, "https://x.test/api/webhooks/circle?secret=s3cret"), "s3cret")).toBe(true);
  });
  it("rejects wrong, missing, or unconfigured secrets", () => {
    expect(secretMatches(req({ "x-webhook-secret": "nope" }), "s3cret")).toBe(false);
    expect(secretMatches(req({}), "s3cret")).toBe(false);
    expect(secretMatches(req({ "x-webhook-secret": "s3cret" }), undefined)).toBe(false);
  });
});
