import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { stegaClean } from "@sanity/client/stega";
import { sanityFetch } from "@/lib/sanity/fetch";
import { MEDIA_QUERY } from "@/lib/sanity/queries";
import { getSiteSettings, getSiteSignals } from "@/lib/sanity/loaders";
import { pageQuery, totalPages } from "@/lib/sanity/paginate";
import { tags } from "@/lib/sanity/tags";
import { joinUrlFor } from "@/lib/circle-links";
import { buildMetadata } from "@/lib/seo";
import { LeadStory } from "@/components/LeadStory";
import { StoryCard } from "@/components/StoryCard";
import { Pagination } from "@/components/Pagination";
import { PageHeader } from "@/components/PageHeader";
import { FilterChips } from "@/components/FilterChips";
import { SchoolHeader } from "@/components/SchoolHeader";
import { SchoolTheme } from "@/components/SchoolTheme";

const PER_PAGE = 24;

export type MediaKind = "podcast" | "video";
type Kind = MediaKind;

const COPY: Record<Kind, { title: string; kicker: string; intro: string; path: string; empty: string }> = {
  podcast: { title: "Podcasts", kicker: "Listen", intro: "Every episode, newest first.", path: "/podcasts", empty: "No episodes yet." },
  video: { title: "Videos", kicker: "Watch", intro: "Film breakdowns, press conferences, and the rest, newest first.", path: "/videos", empty: "No videos yet." },
};

export function mediaHref(kind: Kind, school: string, page: number) {
  const q = new URLSearchParams();
  if (school) q.set("school", school);
  if (page > 1) q.set("page", String(page));
  const s = q.toString();
  return s ? `${COPY[kind].path}?${s}` : COPY[kind].path;
}

function getMedia(kind: Kind, school: string, page: number) {
  return sanityFetch({
    query: pageQuery(MEDIA_QUERY, "[0...24]", page, PER_PAGE),
    params: { type: kind, school },
    tags: [tags.articles, tags.schools],
  });
}

type Filter = { school: string; page: number };

export async function mediaMetadata(kind: Kind, p: Filter): Promise<Metadata> {
  const data = await getMedia(kind, p.school, p.page);
  const scope = data.school?.shortName ? `${data.school.shortName} ` : "";
  return buildMetadata({
    title: `${scope}${COPY[kind].title}${p.page > 1 ? `, page ${p.page}` : ""}`,
    description: `${scope}${COPY[kind].title.toLowerCase()} from Speakeasy Sports. ${COPY[kind].intro}`,
    path: mediaHref(kind, p.school, p.page),
  });
}

/**
 * /podcasts and /videos: the newest as a lead, the rest as a grid, with school filter chips (AGENTS.md section 6).
 * The page itself never reads search params; "?school=" and "?page=" are rewritten to an internal route so every
 * variant is cached like the front pages.
 */
export async function MediaIndexView({ kind, filter: p }: { kind: Kind; filter: Filter }) {
  const [data, settings, signals] = await Promise.all([getMedia(kind, p.school, p.page), getSiteSettings(), getSiteSignals()]);
  if (p.school && !data.school?.slug) notFound();
  const pages = totalPages(data.count, PER_PAGE);
  if (p.page > pages) notFound();

  const copy = COPY[kind];
  const showSchool = !p.school;
  const [first, ...rest] = data.articles;
  const lead = p.page === 1 ? first : undefined;
  const grid = p.page === 1 ? rest : data.articles;

  const body = (
    <>
      {!first && <p className="py-16 font-ui text-fg-muted">{copy.empty}</p>}
      {lead && (
        <div className="pt-10">
          <LeadStory article={lead} showSchool={showSchool} hideAuthors={signals.singleAuthor} />
        </div>
      )}
      {grid.length > 0 && !lead && (
        <h2 className="sr-only">
          {copy.title}, page {p.page}
        </h2>
      )}
      {grid.length > 0 && (
        <div className={`grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 ${lead ? "mt-14 border-t border-line pt-10" : "pt-10"}`}>
          {grid.map((a) => (
            <StoryCard key={a._id} article={a} showSchool={showSchool} hideAuthors={signals.singleAuthor} />
          ))}
        </div>
      )}
      <div className="mt-12">
        <Pagination page={p.page} total={pages} href={(n) => mediaHref(kind, p.school, n)} />
      </div>
    </>
  );

  if (p.school && data.school?.slug) {
    const s = { ...data.school, slug: stegaClean(data.school.slug) };
    return (
      <div data-school={s.slug} className="shell">
        <SchoolTheme slug={s.slug} accentColor={s.accentColor} accentColorDark={s.accentColorDark} />
        <SchoolHeader
          school={s}
          navTags={data.school.navTags}
          joinUrl={joinUrlFor(s, settings)}
          active={kind === "podcast" ? "podcasts" : "videos"}
          media={{ podcasts: signals.hasPodcasts, videos: signals.hasVideos }}
          variant="compact"
          title={copy.title}
        />
        {body}
      </div>
    );
  }

  const chips = [
    { key: "all", label: "All schools", href: mediaHref(kind, "", 1), active: true },
    ...data.schools
      .filter((s) => s.slug)
      .map((s) => ({ key: s._id, label: s.shortName ?? s.name ?? "", href: mediaHref(kind, s.slug!, 1), active: false, school: s.slug })),
  ];

  return (
    <div className="shell">
      <PageHeader kicker={copy.kicker} title={copy.title} intro={copy.intro}>
        <div className="pt-2">
          <FilterChips chips={chips} label="Filter by school" />
        </div>
      </PageHeader>
      {body}
    </div>
  );
}
