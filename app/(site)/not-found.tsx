import Link from "next/link";
import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/sanity/loaders";
import { resolveCopy } from "@/lib/site-copy";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default async function NotFound() {
  const copy = resolveCopy((await getSiteSettings())?.copy).notFound;
  return (
    <div className="shell py-24 text-center">
      <p className="label-caps text-fg-muted">404</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">{copy.headline}</h1>
      <p className="mt-4 text-fg-muted">{copy.body}</p>
      <p className="mt-8 font-ui">
        <Link href="/" className="text-accent">
          {copy.link}
        </Link>
      </p>
    </div>
  );
}
