import type { NextConfig } from "next";
import { RESERVED_SLUGS } from "./lib/reserved-slugs";

// "?page=N" and "?school=x" are rewritten to internal paths, so no public page reads search params and every page
// is static or ISR (AGENTS.md section 3). The internal pages set their canonical back to the query form.
// "all" in an internal path means no school filter (lib/sanity/paginate.ts).
const PAGE_Q = { type: "query" as const, key: "page", value: "(?<page>[1-9]\\d{0,3})" };
const SCHOOL_Q = { type: "query" as const, key: "school", value: "(?<school>[a-z0-9-]+)" };
const PAGE = [PAGE_Q];

/** Most specific first: both params, then school alone, then page alone. */
function filterRewrites(source: string, base: string) {
  return [
    { source, has: [SCHOOL_Q, PAGE_Q], destination: `${base}/f/:school/:page` },
    { source, has: [SCHOOL_Q], destination: `${base}/f/:school/1` },
    { source, has: [PAGE_Q], destination: `${base}/f/all/:page` },
  ];
}

const notReserved = RESERVED_SLUGS.map((s) => `${s.replace(/\./g, "\\.")}$`).join("|");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Sanity's CDN resizes and picks AVIF/WebP itself, so images are not re-processed by Vercel.
    loader: "custom",
    loaderFile: "./lib/sanity/image-loader.ts",
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
    // Heroes top out at 1200px wide, cards at 600 (AGENTS.md section 10).
    deviceSizes: [390, 640, 768, 1024, 1200],
    imageSizes: [64, 104, 176, 240, 360, 480, 600],
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", has: PAGE, destination: "/latest/:page" },
        { source: "/national", has: PAGE, destination: "/national/latest/:page" },
        { source: `/:school((?!${notReserved})[a-z0-9-]+)`, has: PAGE, destination: "/:school/latest/:page" },
        ...filterRewrites("/podcasts", "/podcasts"),
        ...filterRewrites("/videos", "/videos"),
        ...filterRewrites("/tags/:slug", "/tags/:slug"),
        { source: "/authors/:slug", has: PAGE, destination: "/authors/:slug/p/:page" },
      ],
    };
  },
  // School domains, if owned, redirect here (AGENTS.md section 6). No legacy paths to map (V6).
  async redirects() {
    return [];
  },
  async headers() {
    return [
      {
        source: "/studio/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};

export default nextConfig;
