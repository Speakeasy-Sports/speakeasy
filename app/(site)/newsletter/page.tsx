import type { Metadata } from "next";
import { sanityFetch } from "@/lib/sanity/fetch";
import { NEWSLETTER_QUERY } from "@/lib/sanity/queries";
import { getSiteSettings, getSiteSignals } from "@/lib/sanity/loaders";
import { tags } from "@/lib/sanity/tags";
import { buildMetadata } from "@/lib/seo";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { StoryCard } from "@/components/StoryCard";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildMetadata({
    title: settings?.newsletterHeadline ?? "Newsletter",
    description: settings?.newsletterBlurb ?? "The Speakeasy Sports newsletter.",
    path: "/newsletter",
  });
}

export default async function NewsletterPage() {
  const [settings, signals, recent] = await Promise.all([
    getSiteSettings(),
    getSiteSignals(),
    sanityFetch({ query: NEWSLETTER_QUERY, tags: [tags.articles], revalidate: 300 }),
  ]);
  const headline = settings?.newsletterHeadline ?? "The Speakeasy newsletter";

  return (
    <div className="shell">
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 pb-16 pt-14 text-center sm:pb-24 sm:pt-24">
        <p className="label-caps text-fg-muted">Newsletter</p>
        <h1 className="headline text-[2.75rem] leading-[0.98] tracking-[-0.035em] sm:text-[4.5rem]">{headline}</h1>
        {settings?.newsletterBlurb && <p className="max-w-xl text-xl leading-snug text-fg-muted">{settings.newsletterBlurb}</p>}
        <div className="mt-4 w-full max-w-xl text-left">
          <NewsletterSignup variant="page" location="newsletter_page" sampleUrl={settings?.newsletterSampleUrl} />
        </div>
      </section>

      {recent.length > 0 && (
        <section aria-labelledby="nl-recent-h" className="border-t border-line pt-10">
          <h2 id="nl-recent-h" className="rule-heading">
            Recently on Speakeasy
          </h2>
          <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((a) => (
              <StoryCard key={a._id} article={a} hideAuthors={signals.singleAuthor} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
