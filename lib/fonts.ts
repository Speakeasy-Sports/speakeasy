import localFont from "next/font/local";

// Brand type (AGENTS.md V7): Fraunces for headlines and the wordmark, Source Serif 4 for reading. Both are cut down
// in /public/fonts to what the site uses, which keeps all three files near 105KB against the 120KB budget:
// Fraunces at weight 600 only, with its optical-size axis kept so card headlines stay sturdy and leads get finer
// detail; Source Serif at weights 400 to 700. Recut with fontTools' instancer when a weight is added.
export const display = localFont({
  src: [{ path: "../public/fonts/fraunces-latin-600-opsz-normal.woff2", style: "normal", weight: "600" }],
  variable: "--font-fraunces",
  display: "swap",
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
  preload: true,
});

export const serif = localFont({
  src: [{ path: "../public/fonts/source-serif-4-latin-wght-normal.woff2", style: "normal", weight: "400 700" }],
  variable: "--font-serif",
  display: "swap",
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
  preload: true,
});

// The italic is its own family so it is never preloaded. It only appears in article bodies and pull quotes, below
// the first screen, and preloading it competed with the lead image and text: about 0.7s of LCP on Lighthouse mobile.
// globals.css applies it to serif italics (`.article-body em`, `.font-display.italic`); the browser fetches it on use.
export const serifItalic = localFont({
  src: [{ path: "../public/fonts/source-serif-4-latin-wght-italic.woff2", style: "italic", weight: "400 700" }],
  variable: "--font-serif-italic",
  display: "swap",
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
  preload: false,
});
