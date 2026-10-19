import { describe, expect, it } from "vitest";
import { formatLongDate, formatPublished, isUpdated } from "./date";

const now = new Date("2026-10-19T18:00:00Z");

describe("formatPublished", () => {
  it("is relative under 24 hours", () => {
    expect(formatPublished("2026-10-19T17:59:40Z", now)).toBe("Just now");
    expect(formatPublished("2026-10-19T17:59:00Z", now)).toBe("1 minute ago");
    expect(formatPublished("2026-10-19T17:30:00Z", now)).toBe("30 minutes ago");
    expect(formatPublished("2026-10-19T16:00:00Z", now)).toBe("2 hours ago");
    expect(formatPublished("2026-10-18T18:30:00Z", now)).toBe("23 hours ago");
  });
  it("is a long date at 24 hours and beyond", () => {
    expect(formatPublished("2026-10-18T18:00:00Z", now)).toBe("October 18, 2026");
    expect(formatPublished("2026-01-02T05:00:00Z", now)).toBe("January 2, 2026");
  });
  it("uses the long date for future timestamps", () => {
    expect(formatPublished("2026-10-20T18:00:00Z", now)).toBe("October 20, 2026");
  });
  it("returns an empty string for junk", () => {
    expect(formatPublished("nope", now)).toBe("");
  });
});

describe("formatLongDate", () => {
  it("renders Eastern time dates", () => {
    // 03:00 UTC on the 19th is still the 18th in New York.
    expect(formatLongDate("2026-10-19T03:00:00Z")).toBe("October 18, 2026");
  });
});

describe("isUpdated", () => {
  it("ignores missing values and sub-minute differences", () => {
    expect(isUpdated(null, "2026-10-19T00:00:00Z")).toBe(false);
    expect(isUpdated("2026-10-19T00:00:00Z", "2026-10-19T00:00:30Z")).toBe(false);
  });
  it("is true when the update is later by more than a minute", () => {
    expect(isUpdated("2026-10-19T00:00:00Z", "2026-10-19T00:05:00Z")).toBe(true);
  });
});
