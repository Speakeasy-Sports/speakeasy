import { notFound } from "next/navigation";
import { sanityFetch } from "@/lib/sanity/fetch";
import { HOME_PICKS_QUERY, HOME_QUERY } from "@/lib/sanity/queries";
import { selectFront } from "@/lib/fronts";
import { getSiteSettings, getSiteSignals } from "@/lib/sanity/loaders";
import { pageQuery } from "@/lib/sanity/paginate";
import { tags } from "@/lib/sanity/tags";
import { joinUrlFor } from "@/lib/circle-links";
import { resolveCopy } from "@/lib/site-copy";
import { FrontPage, LATEST_PER_PAGE, latestPages } from "@/components/FrontPage";
import { NewsletterSignup } from "@/components/NewsletterSignup";

// Settings tag too: changing the homepage lead changes the front.
const HOME_TAGS = [tags.home, tags.articles, tags.settings];

async function getHomeFront(page: number) {
  const { lead, supporting } = selectFront(await sanityFetch({ query: HOME_PICKS_QUERY, tags: HOME_TAGS }));
  return sanityFetch({
    query: pageQuery(HOME_QUERY, "[0...20]", page, LATEST_PER_PAGE),
    params: { lead: lead ?? "", supporting },
    tags: HOME_TAGS,
  });
}

/** The home front, page 1 at "/" and page N at "/?page=N" (rewritten to /latest/N; see next.config.ts). */
export async function HomeView({ page }: { page: number }) {
  const [data, settings, signals] = await Promise.all([getHomeFront(page), getSiteSettings(), getSiteSignals()]);
  if (page > latestPages(data.count)) notFound();
  const copy = resolveCopy(settings?.copy);

  return (
    <>
      <h1 className="sr-only">{page === 1 ? (settings?.siteName ?? "Speakeasy Sports") : `Latest stories, page ${page}`}</h1>
      <div className="shell">
        <FrontPage
          top={[data.lead, ...data.supporting].filter((a) => a !== null)}
          latest={data.latest}
          count={data.count}
          media={data.media}
          page={page}
          basePath="/"
          hideAuthors={signals.singleAuthor}
          kicker={copy.fronts.positioning}
          community={{ name: copy.join.homeCardHeadline, joinUrl: joinUrlFor(null, settings), findCommunity: true }}
          copy={copy}
        />
      </div>
      <div className="mt-16">
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
