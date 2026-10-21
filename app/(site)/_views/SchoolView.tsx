import { notFound } from "next/navigation";
import { stegaClean } from "@sanity/client/stega";
import { sanityFetch } from "@/lib/sanity/fetch";
import { SCHOOL_FRONT_QUERY } from "@/lib/sanity/queries";
import { getSiteSettings, getSiteSignals } from "@/lib/sanity/loaders";
import { pageQuery } from "@/lib/sanity/paginate";
import { schoolPageTags } from "@/lib/sanity/tags";
import { isReservedSlug } from "@/lib/reserved-slugs";
import { joinUrlFor } from "@/lib/circle-links";
import { FrontPage, LATEST_PER_PAGE, latestPages } from "@/components/FrontPage";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { SchoolHeader } from "@/components/SchoolHeader";
import { SchoolTheme } from "@/components/SchoolTheme";

const SLUG_RE = /^[a-z0-9-]+$/;

export function getSchoolFront(slug: string, page = 1) {
  if (isReservedSlug(slug) || !SLUG_RE.test(slug)) return Promise.resolve(null);
  return sanityFetch({
    query: pageQuery(SCHOOL_FRONT_QUERY, "[0...20]", page, LATEST_PER_PAGE),
    params: { slug },
    tags: schoolPageTags(slug),
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

  return (
    <div data-school={schoolSlug}>
      <SchoolTheme slug={schoolSlug} accentColor={school.accentColor} accentColorDark={school.accentColorDark} />
      <div className="shell">
        {page === 1 ? (
          <SchoolHeader school={{ ...school, slug: schoolSlug }} navTags={school.navTags} joinUrl={joinUrl} active="latest" media={media} />
        ) : (
          <SchoolHeader
            school={{ ...school, slug: schoolSlug }}
            navTags={school.navTags}
            joinUrl={joinUrl}
            active="latest"
            media={media}
            variant="compact"
            title={`Latest, page ${page}`}
          />
        )}
        <FrontPage
          top={school.top}
          latest={school.latest}
          count={school.count}
          media={school.media}
          page={page}
          basePath={`/${schoolSlug}`}
          schoolSlug={schoolSlug}
          hideAuthors={signals.singleAuthor}
          community={{ name: school.communityName ?? "Join the Club", joinUrl }}
        />
      </div>
      <div className="mt-24">
        <NewsletterSignup
          variant="band"
          headline={settings?.newsletterHeadline}
          blurb={settings?.newsletterBlurb}
          sampleUrl={settings?.newsletterSampleUrl}
          school={schoolSlug}
          location="school"
        />
      </div>
    </div>
  );
}
