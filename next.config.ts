import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Sanity's CDN resizes and picks AVIF/WebP itself, so images are not re-processed by Vercel.
    loader: "custom",
    loaderFile: "./lib/sanity/image-loader.ts",
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
    deviceSizes: [390, 430, 640, 768, 1024, 1280, 1536],
    imageSizes: [96, 160, 240, 320, 480, 600],
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
