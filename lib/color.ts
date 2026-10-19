// Small color helpers for school accents. WCAG 2.x relative luminance and contrast ratio.

export const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function isHex(value: unknown): value is string {
  return typeof value === "string" && HEX_RE.test(value);
}

function channel(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Text color to place on an accent background: white when it passes 4.5:1, otherwise near-black. */
export function accentForeground(accent: string, dark = false): string {
  const white = "#ffffff";
  const ink = dark ? DARK_BG : "#141414";
  return contrast(accent, white) >= 4.5 ? white : ink;
}

export const LIGHT_BG = "#fcfbf8";
export const DARK_BG = "#121210";
export const DARK_BG_ELEV = "#1a1a17";

function toHex(n: number): string {
  return Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");
}

function mix(hex: string, target: string, amount: number): string {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const t = [1, 3, 5].map((i) => parseInt(target.slice(i, i + 2), 16));
  return `#${c.map((v, i) => toHex(v + ((t[i] ?? 0) - v) * amount)).join("")}`;
}

/**
 * Lightens (or darkens) a color by mixing toward white (or black) in 2% steps until it reaches the ratio on the
 * background. Used to derive a dark-mode accent when a school has none, so the hue survives and the contrast rule holds.
 */
export function ensureContrast(hex: string, background: string, minRatio = 4.5): string {
  if (contrast(hex, background) >= minRatio) return hex.toLowerCase();
  const toward = luminance(background) < 0.5 ? "#ffffff" : "#000000";
  for (let amount = 0.02; amount <= 1; amount += 0.02) {
    const candidate = mix(hex, toward, amount);
    if (contrast(candidate, background) >= minRatio) return candidate;
  }
  return toward;
}
