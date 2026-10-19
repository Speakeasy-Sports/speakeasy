import { describe, expect, it } from "vitest";
import { accentForeground, contrast, isHex } from "./color";

describe("color", () => {
  it("validates hex", () => {
    expect(isHex("#BA0C2F")).toBe(true);
    expect(isHex("#ba0c2f")).toBe(true);
    expect(isHex("BA0C2F")).toBe(false);
    expect(isHex("#fff")).toBe(false);
    expect(isHex(null)).toBe(false);
  });

  it("matches the spec's Georgia contrast numbers", () => {
    expect(contrast("#BA0C2F", "#FCFBF8")).toBeCloseTo(6.38, 1);
    expect(contrast("#E44A64", "#121210")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#E44A64", "#1A1A17")).toBeGreaterThanOrEqual(4.5);
  });

  it("picks white on the light red and near-black on the dark red", () => {
    expect(accentForeground("#BA0C2F")).toBe("#ffffff");
    expect(accentForeground("#E44A64", true)).toBe("#121210");
  });
});
