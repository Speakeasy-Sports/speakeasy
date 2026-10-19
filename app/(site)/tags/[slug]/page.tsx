import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { stegaClean } from "@sanity/client/stega";
import { sanityFetch } from "@/lib/sanity/fetch";
import { TAG_QUERY } from "@/lib/sanity/queries";
import { getSiteSettings } from "@/lib/sanity/loaders";
import { pageQuery, parsePage, totalPages } from "@/lib/sanity/paginate";
import { tags } from "@/lib/sanity/tags";
import { joinUrlFor } from "@/lib/circle-links";
import { buildMetadata, tagPath } from "@/lib/seo";
import { StoryRow } from "@/components/StoryRow";
import { Pagination } from "@/components/Pagination";
import { PageHeader } from "@/components/PageHeader";
import { FilterChips } from "@/components/FilterChips";
import { SchoolHeader } from "@/components/SchoolHeader";
import { SchoolTheme } from "@/components/SchoolTheme";

const PER_PAGE = 16;
const SLUG_RE = /^[a-z0-9-]+$/;

type Search = { page?: string | string[]; school?: string | string[] };
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Search> };

function readSchool(raw: Search["school"]): string | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === undefined || v === "") return "";
  return SLUG_RE.test(v) ? v : null;
}

function getTag(slug: string, school: string, page: number) {
  if (!SLUG_RE.test(slug)) return Promise.resolve(null);
  return sanityFetch({
    query: pageQuery(TAG_QUERY, "[0...16]", page, PER_PAGE),
    params: { slug, school },
    tags: [tags.tag(slug), tags.taxonomy, tags.articles, tags.schools],
  });
}

function href(slug: string, school: string, page: number) {
  const q = new URLSearchParams();
  if (school) q.set("school", school);
  if (page > 1) q.set("page", String(page));
  const s = q.toString();
  return s ? `${tagPath(slug)}?${s}` : tagPath(slug);
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const school = readSchool(sp.school);
  const page = parsePage(sp.page);
  if (school === null || !page) return {};
  const tag = await getTag(slug, school, page);
  if (!tag?.name) return {};
  const scope = tag.school?.shortName ? `${tag.school.shortName} ` : "";
  return buildMetadata({
    title: `${scope}${tag.name}${page > 1 ? `, page ${page}` : ""}`,
    description: tag.description ?? `${scope}${tag.name} stories from Speakeasy Sports.`,
    path: href(slug, school, page),
  });
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const school = readSchool(sp.school);
  const page = parsePage(sp.page);
  if (school === null || !page) notFound();

  const [tag, settings] = await Promise.all([getTag(slug, school, page), getSiteSettings()]);
  if (!tag?.name) notFound();
  if (school && !tag.school?.slug) notFound();
  const pages = totalPages(tag.count, PER_PAGE);
  if (page > pages) notFound();

  const list = (
    <section aria-label={`${tag.name} stories`} className="mt-4 max-w-4xl">
      {tag.articles.length > 0 ? (
        <div className="divide-y divide-line">
          {tag.articles.map((a) => (
            <StoryRow key={a._id} article={a} showSchool={!school} />
          ))}
        </div>
      ) : (
        <p className="py-12 font-ui text-fg-muted">No stories under this topic yet.</p>
      )}
      <Pagination page={page} total={pages} href={(n) => href(slug, school, n)} />
    </section>
  );

  if (school && tag.school?.slug) {
    const s = { ...tag.school, slug: stegaClean(tag.school.slug) };
    return (
      <div data-school={s.slug} className="shell">
        <SchoolTheme slug={s.slug} accentColor={s.accentColor} accentColorDark={s.accentColorDark} />
        <SchoolHeader
          school={s}
          navTags={tag.school.navTags}
          joinUrl={joinUrlFor(s, settings)}
          active={slug}
          variant="compact"
          title={tag.name}
        />
        {tag.description && <p className="mt-8 max-w-2xl text-lg leading-snug text-fg-muted">{tag.description}</p>}
        {list}
      </div>
    );
  }

  const chips = [
    { key: "all", label: "All schools", href: href(slug, "", 1), active: !school },
    ...tag.schools
      .filter((s) => s.slug)
      .map((s) => ({ key: s._id, label: s.shortName ?? s.name ?? "", href: href(slug, s.slug!, 1), active: false, school: s.slug })),
  ];

  return (
    <div className="shell">
      <PageHeader kicker="Topic" title={tag.name} intro={tag.description}>
        <div className="flex flex-col gap-5 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <FilterChips chips={chips} label="Filter by school" />
          <p className="font-ui text-sm tabular-nums text-fg-muted">{tag.count === 1 ? "1 story" : `${tag.count} stories`}</p>
        </div>
      </PageHeader>
      {list}
    </div>
  );
}
