import { describe, expect, it } from "vitest";
import { safeReturnPath } from "./safe-return-path";

const origin = "https://speakeasysports.com";

describe("safeReturnPath", () => {
  it("keeps same-origin paths with query and hash", () => {
    expect(safeReturnPath("/georgia/story?x=1#top", origin)).toBe("/georgia/story?x=1#top");
  });
  it("sends everything else home", () => {
    expect(safeReturnPath(null, origin)).toBe("/");
    expect(safeReturnPath("//evil.com/x", origin)).toBe("/");
    expect(safeReturnPath("/\\evil.com", origin)).toBe("/");
    expect(safeReturnPath("https://evil.com/x", origin)).toBe("/");
    expect(safeReturnPath("javascript:alert(1)", origin)).toBe("/");
  });
});
