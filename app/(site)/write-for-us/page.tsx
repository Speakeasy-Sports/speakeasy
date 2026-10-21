import type { Metadata } from "next";
import { InfoPageView, infoPageMetadata } from "../_views/InfoPageView";
import { WriteForUsForm } from "@/components/WriteForUsForm";

export const revalidate = 3600;

export function generateMetadata(): Promise<Metadata> {
  return infoPageMetadata("write-for-us");
}

/** Recruiting page (AGENTS.md 7.9): Studio copy above, the application below. */
export default function WriteForUsPage() {
  return (
    <InfoPageView
      slug="write-for-us"
      after={
        <section aria-labelledby="apply-h" className="mt-12 flex flex-col gap-6 border border-line bg-bg-elev p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <p className="label-caps text-fg-muted">Apply</p>
            <h2 id="apply-h" className="headline text-2xl leading-tight sm:text-[1.75rem]">
              Tell us about yourself
            </h2>
          </div>
          <WriteForUsForm />
        </section>
      }
    />
  );
}
