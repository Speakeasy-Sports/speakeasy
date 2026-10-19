import type { Metadata } from "next";
import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo";
import { SearchClient } from "@/components/SearchClient";

// Static shell; the query comes from ?q= in the browser and the index loads there too (AGENTS.md section 6).
export const metadata: Metadata = {
  ...buildMetadata({ title: "Search", description: "Search every Speakeasy Sports story.", path: "/search" }),
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  return (
    <div className="shell max-w-4xl pt-10 sm:pt-14">
      <h1 className="label-caps mb-4 text-fg-muted">Search</h1>
      {/* Same footprint as the input so nothing moves when the client part arrives. */}
      <Suspense fallback={<div aria-hidden="true" className="h-16 border-b-2 border-fg sm:h-20" />}>
        <SearchClient />
      </Suspense>
    </div>
  );
}
