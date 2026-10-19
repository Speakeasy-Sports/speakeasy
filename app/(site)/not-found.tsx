import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="shell py-24 text-center">
      <p className="label-caps text-fg-muted">404</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">That page is not here</h1>
      <p className="mt-4 text-fg-muted">It may have moved, or the link was wrong.</p>
      <p className="mt-8 font-ui">
        <Link href="/" className="text-accent">
          Back to the front page
        </Link>
      </p>
    </div>
  );
}
