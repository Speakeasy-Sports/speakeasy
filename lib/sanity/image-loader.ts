"use client";

import type { ImageLoaderProps } from "next/image";

/**
 * next/image loader for Sanity CDN URLs (next.config images.loaderFile).
 * Keeps any crop (rect) and focal point the URL already carries, scales h with w, and lets the CDN pick the format.
 */
export default function sanityImageLoader({ src, width, quality }: ImageLoaderProps): string {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src;
  }
  if (!url.hostname.endsWith("cdn.sanity.io")) return src;

  const w = Number(url.searchParams.get("w"));
  const h = Number(url.searchParams.get("h"));
  if (w > 0 && h > 0) {
    url.searchParams.set("h", String(Math.round((h * width) / w)));
  }
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  url.searchParams.set("auto", "format");
  // Local runs against scripts/mock-sanity.mjs swap the CDN for the mock's placeholder art. Unset in every real deploy.
  const mockOrigin = process.env.NEXT_PUBLIC_SANITY_IMAGE_ORIGIN;
  if (mockOrigin) return `${mockOrigin}${url.pathname}${url.search}`;
  return url.toString();
}
