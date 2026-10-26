import { notFound } from "next/navigation";
import { stegaClean } from "@sanity/client/stega";
import { sanityFetch } from "@/lib/sanity/fetch";
import { SCHOOL_FRONT_QUERY, SCHOOL_PICKS_QUERY } from "@/lib/sanity/queries";
import { selectFront } from "@/lib/fronts";
import { getSiteSettings, getSiteSignals } from "@/lib/sanity/loaders";
import { pageQuery } from "@/lib/sanity/paginate";
import { schoolPageTags, tags } from "@/lib/sanity/tags";
import { isReservedSlug } from "@/lib/reserved-slugs";
import { joinUrlFor } from "@/lib/circle-links";
import { resolveCopy } from "@/lib/site-copy";
import { FrontPage, LATEST_PER_PAGE, latestPages } from "@/components/FrontPage";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { SchoolHeader } from "@/components/SchoolHeader";
import { SchoolTheme } from "@/components/SchoolTheme";

const SLUG_RE = /^[a-z0-9-]+$/;

export async function getSchoolFront(slug: string, page = 1) {
  if (isReservedSlug(slug) || !SLUG_RE.test(slug)) return null;
  // Settings tag too: changing the homepage lead can change this front's lead.
  const frontTags = [...schoolPageTags(slug), tags.settings];
  const picks = await sanityFetch({ query: SCHOOL_PICKS_QUERY, params: { slug }, tags: frontTags });
  const { lead, supporting } = selectFront(picks);
  return sanityFetch({
    query: pageQuery(SCHOOL_FRONT_QUERY, "[0...20]", page, LATEST_PER_PAGE),
    params: { slug, lead: lead ?? "", supporting },
    tags: frontTags,
  });
}

/** A school's section front: header, sub-nav, then the same front layout as home, scoped to the school. */
export async function SchoolView({ slug, page }: { slug: string; page: number }) {
  const [school, settings, signals] = await Promise.all([getSchoolFront(slug, page), getSiteSettings(), getSiteSignals()]);
  const media = { podcasts: signals.hasPodcasts, videos: signals.hasVideos };
  if (!school?.slug) notFound();
  if (page > latestPages(school.count)) notFound();

  const schoolSlug = stegaClean(school.slug);
  const joinUrl = joinUrlFor(school, settings);
  const copy = resolveCopy(settings?.copy);

  return (
    <div data-school={schoolSlug}>
      <SchoolTheme slug={schoolSlug} accentColor={school.accentColor} accentColorDark={school.accentColorDark} />
      <div className="shell">
        {page === 1 ? (
          <SchoolHeader
            school={{ ...school, slug: schoolSlug }}
            navTags={school.navTags}
            joinUrl={joinUrl}
            joinLabel={copy.join.schoolButton}
            active="latest"
            media={media}
          />
        ) : (
          <SchoolHeader
            school={{ ...school, slug: schoolSlug }}
            navTags={school.navTags}
            joinUrl={joinUrl}
            joinLabel={copy.join.schoolButton}
            active="latest"
            media={media}
            variant="compact"
            title={`Latest, page ${page}`}
          />
        )}
        <FrontPage
          top={[school.lead, ...school.supporting].filter((a) => a !== null)}
          latest={school.latest}
          count={school.count}
          media={school.media}
          page={page}
          basePath={`/${schoolSlug}`}
          schoolSlug={schoolSlug}
          hideAuthors={signals.singleAuthor}
          community={{ name: school.communityName ?? copy.join.homeCardHeadline, joinUrl }}
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
          school={schoolSlug}
          location="school"
        />
      </div>
    </div>
  );
}
