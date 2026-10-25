import { notFound } from "next/navigation";
import { sanityFetch } from "@/lib/sanity/fetch";
import { NATIONAL_FRONT_QUERY, NATIONAL_PICKS_QUERY } from "@/lib/sanity/queries";
import { selectFront } from "@/lib/fronts";
import { getSiteSettings, getSiteSignals } from "@/lib/sanity/loaders";
import { pageQuery } from "@/lib/sanity/paginate";
import { tags } from "@/lib/sanity/tags";
import { resolveCopy } from "@/lib/site-copy";
import { NATIONAL_SLUG } from "@/lib/seo";
import { joinUrlFor } from "@/lib/circle-links";
import { FrontPage, LATEST_PER_PAGE, latestPages } from "@/components/FrontPage";
import { NewsletterSignup } from "@/components/NewsletterSignup";

const NATIONAL_TAGS = [tags.articles, tags.settings];

export async function getNationalFront(page = 1) {
  const { lead, supporting } = selectFront(await sanityFetch({ query: NATIONAL_PICKS_QUERY, tags: NATIONAL_TAGS }));
  return sanityFetch({
    query: pageQuery(NATIONAL_FRONT_QUERY, "[0...20]", page, LATEST_PER_PAGE),
    params: { lead: lead ?? "", supporting },
    tags: NATIONAL_TAGS,
  });
}

/**
 * /national: national-scope stories in the same front layout as a school, in the neutral brand treatment
 * (docs/specs/phase-1-ux-update.md, 3.3). No Join card: there is no national club yet.
 */
export async function NationalView({ page }: { page: number }) {
  const [data, settings, signals] = await Promise.all([getNationalFront(page), getSiteSettings(), getSiteSignals()]);
  if (page > latestPages(data.count)) notFound();
  const copy = resolveCopy(settings?.copy);

  return (
    <>
      <div className="shell">
        <header className="pt-10 sm:pt-14">
          <div className="flex flex-col gap-3 pb-6">
            <p className="label-caps text-fg-muted">{copy.national.kicker}</p>
            <h1 className="headline text-[3rem] leading-[0.95] tracking-[-0.035em] sm:text-[4.5rem] lg:text-[5.5rem]">
              {page === 1 ? copy.national.heading : `${copy.national.heading}: latest, page ${page}`}
            </h1>
          </div>
          <div className="border-t-[3px] border-fg" />
        </header>
        <FrontPage
          top={[data.lead, ...data.supporting].filter((a) => a !== null)}
          latest={data.latest}
          count={data.count}
          media={data.media}
          page={page}
          basePath={`/${NATIONAL_SLUG}`}
          national
          // Same club card as home: the site-wide join link and "Find your community", never one school's signup.
          community={{ name: copy.join.homeCardHeadline, joinUrl: joinUrlFor(null, settings), findCommunity: true }}
          hideAuthors={signals.singleAuthor}
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
          location="national"
        />
      </div>
    </>
  );
}
