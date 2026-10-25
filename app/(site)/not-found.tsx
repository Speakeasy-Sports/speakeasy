import Link from "next/link";
import type { Metadata } from "next";
import { sanityFetch } from "@/lib/sanity/fetch";
import { NEWSLETTER_QUERY } from "@/lib/sanity/queries";
import { getSiteSettings, getSiteSignals } from "@/lib/sanity/loaders";
import { tags } from "@/lib/sanity/tags";
import { resolveCopy } from "@/lib/site-copy";
import { StoryRow } from "@/components/StoryRow";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

/** A dead link still leads somewhere: the way home, and the three newest stories (design sweep F20). */
export default async function NotFound() {
  const [settings, signals, recent] = await Promise.all([
    getSiteSettings(),
    getSiteSignals(),
    sanityFetch({ query: NEWSLETTER_QUERY, tags: [tags.articles], revalidate: 300 }),
  ]);
  const copy = resolveCopy(settings?.copy).notFound;
  return (
    <div className="shell max-w-3xl py-16 sm:py-24">
      <div className="flex flex-col items-start gap-4">
        <p className="label-caps text-fg-muted">404</p>
        <h1 className="headline text-4xl leading-[1.05] sm:text-5xl">{copy.headline}</h1>
        <p className="text-lg text-fg-muted">{copy.body}</p>
        <Link
          href="/"
          className="mt-2 inline-flex h-11 items-center justify-center rounded-base border border-fg px-4 font-ui text-sm font-semibold text-fg no-underline transition-colors hover:bg-bg-elev sm:h-10"
        >
          {copy.link}
        </Link>
      </div>
      {recent.length > 0 && (
        <section aria-labelledby="nf-latest" className="mt-16">
          <h2 id="nf-latest" className="rule-heading">
            Latest
          </h2>
          <div className="divide-y divide-line">
            {recent.map((a) => (
              <StoryRow key={a._id} article={a} hideAuthors={signals.singleAuthor} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
