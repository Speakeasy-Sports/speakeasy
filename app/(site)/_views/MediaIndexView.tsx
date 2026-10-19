import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { stegaClean } from "@sanity/client/stega";
import { sanityFetch } from "@/lib/sanity/fetch";
import { MEDIA_QUERY } from "@/lib/sanity/queries";
import { getSiteSettings } from "@/lib/sanity/loaders";
import { pageQuery, parsePage, totalPages } from "@/lib/sanity/paginate";
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
const SLUG_RE = /^[a-z0-9-]+$/;

export type MediaSearch = { page?: string | string[]; school?: string | string[] };
type Kind = "podcast" | "video";

const COPY: Record<Kind, { title: string; kicker: string; intro: string; path: string; empty: string }> = {
  podcast: { title: "Podcasts", kicker: "Listen", intro: "Every episode, newest first.", path: "/podcasts", empty: "No episodes yet." },
  video: { title: "Videos", kicker: "Watch", intro: "Film breakdowns, press conferences, and the rest, newest first.", path: "/videos", empty: "No videos yet." },
};

function readParams(sp: MediaSearch): { school: string; page: number } | null {
  const raw = Array.isArray(sp.school) ? sp.school[0] : sp.school;
  const school = raw ?? "";
  const page = parsePage(sp.page);
  if (!page || (school && !SLUG_RE.test(school))) return null;
  return { school, page };
}

function href(kind: Kind, school: string, page: number) {
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

export async function mediaMetadata(kind: Kind, sp: MediaSearch): Promise<Metadata> {
  const p = readParams(sp);
  if (!p) return {};
  const data = await getMedia(kind, p.school, p.page);
  const scope = data.school?.shortName ? `${data.school.shortName} ` : "";
  return buildMetadata({
    title: `${scope}${COPY[kind].title}${p.page > 1 ? `, page ${p.page}` : ""}`,
    description: `${scope}${COPY[kind].title.toLowerCase()} from Speakeasy Sports. ${COPY[kind].intro}`,
    path: href(kind, p.school, p.page),
  });
}

/** /podcasts and /videos: the newest as a lead, the rest as a grid, with school filter chips (AGENTS.md section 6). */
export async function MediaIndexView({ kind, searchParams }: { kind: Kind; searchParams: MediaSearch }) {
  const p = readParams(searchParams);
  if (!p) notFound();
  const [data, settings] = await Promise.all([getMedia(kind, p.school, p.page), getSiteSettings()]);
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
          <LeadStory article={lead} showSchool={showSchool} />
        </div>
      )}
      {grid.length > 0 && (
        <div className={`grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 ${lead ? "mt-14 border-t border-line pt-10" : "pt-10"}`}>
          {grid.map((a) => (
            <StoryCard key={a._id} article={a} showSchool={showSchool} />
          ))}
        </div>
      )}
      <div className="mt-12">
        <Pagination page={p.page} total={pages} href={(n) => href(kind, p.school, n)} />
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
          variant="compact"
          title={copy.title}
        />
        {body}
      </div>
    );
  }

  const chips = [
    { key: "all", label: "All schools", href: href(kind, "", 1), active: true },
    ...data.schools
      .filter((s) => s.slug)
      .map((s) => ({ key: s._id, label: s.shortName ?? s.name ?? "", href: href(kind, s.slug!, 1), active: false, school: s.slug })),
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
