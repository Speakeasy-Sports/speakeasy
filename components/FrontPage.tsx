import type { ArticleCard } from "@/lib/types";
import { LeadStory } from "./LeadStory";
import { StoryCard } from "./StoryCard";
import { StoryRow } from "./StoryRow";
import { Pagination } from "./Pagination";
import { MediaRail } from "./MediaRail";
import { JoinCard } from "./JoinCard";

export const LATEST_PER_PAGE = 20;
export const TOP_COUNT = 4;
/** Below this many live stories the front is the lead plus one list; the row of three needs a real Latest under it. */
export const COMPACT_FRONT_BELOW = 8;

type Props = {
  top: ArticleCard[];
  latest: ArticleCard[];
  /** Live articles in scope, top stories included. */
  count: number;
  media: ArticleCard[];
  page: number;
  /** "/" or "/georgia"; page N links to `${basePath}?page=N`. */
  basePath: string;
  /** Set on a school's section front: hides the now-redundant school label on every story. */
  schoolSlug?: string | null;
  community: { name: string; joinUrl: string };
  /** Date only on every story, for while one person writes everything. */
  hideAuthors?: boolean;
};

export function latestPages(count: number): number {
  return Math.max(1, Math.ceil(Math.max(0, count - TOP_COUNT) / LATEST_PER_PAGE));
}

/** Newest first, for folding the secondary top stories back into Latest on a compact front. */
function byDate(a: ArticleCard, b: ArticleCard): number {
  return (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
}

/**
 * Home and school fronts (AGENTS.md section 6): lead, a row of three, then Latest beside a rail, then pagination.
 * Pages 2 and up show only the Latest river. With fewer than COMPACT_FRONT_BELOW stories (launch), the row of three
 * folds into Latest so the page reads as a lead and a list instead of a lead, three cards, and one stray row.
 */
export function FrontPage({ top, latest: river, count, media, page, basePath, schoolSlug, community, hideAuthors }: Props) {
  const showSchool = !schoolSlug;
  const compact = count < COMPACT_FRONT_BELOW;
  const [lead, ...rest] = top;
  const secondary = compact ? [] : rest;
  const latest = compact ? [...rest, ...river].sort(byDate) : river;
  const total = latestPages(count);
  const href = (n: number) => (n === 1 ? basePath : `${basePath}?page=${n}`);

  if (!lead) {
    return (
      <div className="py-24 text-center">
        <p className="label-caps text-fg-muted">Nothing yet</p>
        <p className="headline mt-3 text-3xl">The first stories are on the way.</p>
      </div>
    );
  }

  return (
    <>
      {page === 1 && (
        <section aria-label="Top stories" className="pt-8 sm:pt-12">
          <LeadStory article={lead} showSchool={showSchool} hideAuthors={hideAuthors} />
          {secondary.length > 0 && (
            <div className="mt-10 grid gap-6 border-t border-line pt-8 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 lg:mt-14 lg:grid-cols-3 lg:gap-x-16 lg:column-rules [&>*+*]:border-t [&>*+*]:border-line [&>*+*]:pt-6 sm:[&>*+*]:border-t-0 sm:[&>*+*]:pt-0">
              {secondary.map((a) => (
                <StoryCard key={a._id} article={a} showSchool={showSchool} hideAuthors={hideAuthors} compactOnPhone />
              ))}
            </div>
          )}
        </section>
      )}

      <div className={`grid gap-14 lg:grid-cols-12 lg:gap-12 ${page === 1 ? "mt-14 lg:mt-20" : "mt-10"}`}>
        <section aria-labelledby="latest-h" className="min-w-0 lg:col-span-8">
          {(latest.length > 0 || !compact) && (
            <h2 id="latest-h" className="rule-heading">
              {page === 1 ? "Latest" : `Latest, page ${page}`}
            </h2>
          )}
          {latest.length > 0 ? (
            <div className="divide-y divide-line">
              {latest.map((a) => (
                <StoryRow key={a._id} article={a} showSchool={showSchool} hideAuthors={hideAuthors} />
              ))}
            </div>
          ) : (
            !compact && <p className="py-10 font-ui text-fg-muted">Everything new is in the stories above.</p>
          )}
          <Pagination page={page} total={total} href={href} label="Latest stories pages" />
        </section>

        <aside aria-label="More from Speakeasy" className="flex flex-col gap-12 lg:sticky lg:top-8 lg:col-span-4 lg:self-start">
          <JoinCard communityName={community.name} joinUrl={community.joinUrl} schoolSlug={schoolSlug} />
          <MediaRail items={media} schoolSlug={schoolSlug} showSchool={showSchool} />
        </aside>
      </div>
    </>
  );
}
