import localFont from "next/font/local";

// Placeholder type until brand fonts are chosen (AGENTS.md V7). One variable family covers display and body,
// which keeps the total under the 120KB budget. Swap the files in /public/fonts and update the paths here.
export const serif = localFont({
  src: [
    { path: "../public/fonts/source-serif-4-latin-wght-normal.woff2", style: "normal", weight: "200 900" },
    { path: "../public/fonts/source-serif-4-latin-wght-italic.woff2", style: "italic", weight: "200 900" },
  ],
  variable: "--font-serif",
  display: "swap",
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
  preload: true,
});
