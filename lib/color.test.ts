import { describe, expect, it } from "vitest";
import { accentForeground, contrast, DARK_BG_ELEV, ensureContrast, isHex, LIGHT_BG } from "./color";

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

  it("derives a dark-mode accent that passes when a school has none", () => {
    expect(contrast("#BA0C2F", DARK_BG_ELEV)).toBeLessThan(4.5);
    const derived = ensureContrast("#BA0C2F", DARK_BG_ELEV);
    expect(contrast(derived, DARK_BG_ELEV)).toBeGreaterThanOrEqual(4.5);
    // Still red: the red channel dominates.
    const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => parseInt(derived.slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(g + 60);
    expect(r).toBeGreaterThan(b + 40);
  });

  it("leaves passing colors alone and darkens toward black on light backgrounds", () => {
    expect(ensureContrast("#E44A64", DARK_BG_ELEV)).toBe("#e44a64");
    expect(ensureContrast("#BA0C2F", LIGHT_BG)).toBe("#ba0c2f");
    const fixed = ensureContrast("#ff9aa2", LIGHT_BG);
    expect(contrast(fixed, LIGHT_BG)).toBeGreaterThanOrEqual(4.5);
  });
});
