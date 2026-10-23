import type { Metadata } from "next";
import { InfoPageView, infoPageMetadata } from "../_views/InfoPageView";
import { WriteForUsForm } from "@/components/WriteForUsForm";
import { getSiteSettings } from "@/lib/sanity/loaders";
import { resolveCopy } from "@/lib/site-copy";

export const revalidate = 3600;

export function generateMetadata(): Promise<Metadata> {
  return infoPageMetadata("write-for-us");
}

/** Recruiting page (AGENTS.md 7.9): Studio copy above, the application below. */
export default async function WriteForUsPage() {
  const copy = resolveCopy((await getSiteSettings())?.copy).writeForUs;
  return (
    <InfoPageView
      slug="write-for-us"
      after={
        <section aria-labelledby="apply-h" className="mt-12 flex flex-col gap-6 border border-line bg-bg-elev p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <p className="label-caps text-fg-muted">{copy.kicker}</p>
            <h2 id="apply-h" className="headline text-2xl leading-tight sm:text-[1.75rem]">
              {copy.heading}
            </h2>
          </div>
          <WriteForUsForm copy={copy} />
        </section>
      }
    />
  );
}
