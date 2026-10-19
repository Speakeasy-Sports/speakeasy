import type { NextConfig } from "next";
import { RESERVED_SLUGS } from "./lib/reserved-slugs";

// "?page=N" on a front page is rewritten to an internal path, so "/" and "/{school}" never read search params and
// stay fully static. The internal pages set their canonical back to the "?page=N" form.
const PAGE = [{ type: "query" as const, key: "page", value: "(?<page>[1-9]\\d{0,3})" }];
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
        { source: `/:school((?!${notReserved})[a-z0-9-]+)`, has: PAGE, destination: "/:school/latest/:page" },
      ],
    };
  },
  // Legacy WordPress paths are mapped here once captured (AGENTS.md section 6, item V6).
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
