import { notFound } from "next/navigation";
import { sanityFetch } from "@/lib/sanity/fetch";
import { HOME_QUERY } from "@/lib/sanity/queries";
import { getSiteSettings, getSiteSignals } from "@/lib/sanity/loaders";
import { pageQuery } from "@/lib/sanity/paginate";
import { tags } from "@/lib/sanity/tags";
import { joinUrlFor } from "@/lib/circle-links";
import { resolveCopy } from "@/lib/site-copy";
import { FrontPage, LATEST_PER_PAGE, latestPages } from "@/components/FrontPage";
import { NewsletterSignup } from "@/components/NewsletterSignup";

/** The home front, page 1 at "/" and page N at "/?page=N" (rewritten to /latest/N; see next.config.ts). */
export async function HomeView({ page }: { page: number }) {
  const [data, settings, signals] = await Promise.all([
    sanityFetch({ query: pageQuery(HOME_QUERY, "[0...20]", page, LATEST_PER_PAGE), tags: [tags.home, tags.articles] }),
    getSiteSettings(),
    getSiteSignals(),
  ]);
  if (page > latestPages(data.count)) notFound();
  const copy = resolveCopy(settings?.copy);

  return (
    <>
      <h1 className="sr-only">{page === 1 ? (settings?.siteName ?? "Speakeasy Sports") : `Latest stories, page ${page}`}</h1>
      <div className="shell">
        <FrontPage
          top={data.top}
          latest={data.latest}
          count={data.count}
          media={data.media}
          page={page}
          basePath="/"
          hideAuthors={signals.singleAuthor}
          community={{ name: copy.join.homeCardHeadline, joinUrl: joinUrlFor(null, settings) }}
          copy={copy}
        />
      </div>
      <div className="mt-24">
        <NewsletterSignup
          variant="band"
          headline={settings?.newsletterHeadline}
          blurb={settings?.newsletterBlurb}
          sampleUrl={settings?.newsletterSampleUrl}
          copy={copy.newsletter}
          location="home"
        />
      </div>
    </>
  );
}
