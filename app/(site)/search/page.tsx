import type { Metadata } from "next";
import { Suspense } from "react";
import { getSiteSettings } from "@/lib/sanity/loaders";
import { pageSeo } from "@/lib/page-seo";
import { buildMetadata, defaultOgImage } from "@/lib/seo";
import { SearchClient } from "@/components/SearchClient";

// Static shell; the query comes from ?q= in the browser and the index loads there too (AGENTS.md section 6).
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const seo = pageSeo(settings?.pageSeo, "search");
  return {
    ...buildMetadata({
      title: seo.title ?? "Search",
      description: seo.description ?? "Search every Speakeasy Sports story.",
      path: "/search",
      fallbackImage: defaultOgImage(settings),
    }),
    robots: { index: false, follow: true },
  };
}

export default function SearchPage() {
  return (
    <div className="shell max-w-4xl pt-10 sm:pt-14">
      <h1 className="headline mb-6 text-[2.75rem] leading-[0.98] tracking-[-0.03em] sm:text-[4rem]">Search</h1>
      {/* Same footprint as the input so nothing moves when the client part arrives. */}
      <Suspense fallback={<div aria-hidden="true" className="h-16 border-b-2 border-fg sm:h-20" />}>
        <SearchClient />
      </Suspense>
    </div>
  );
}
