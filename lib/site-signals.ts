import type { SITE_SIGNALS_QUERY_RESULT } from "@/sanity.types";

/** What launch-stage pages switch on (AGENTS.md section 6, Launch mode). Each turns itself off as content arrives. */
export type SiteSignals = {
  /** Show Podcasts links in the header, footer, menu, and section sub-nav. */
  hasPodcasts: boolean;
  /** Show Videos links in the same places. */
  hasVideos: boolean;
  /** Every live article is by one person, so story cards drop the byline and keep the date. */
  singleAuthor: boolean;
};

export function deriveSignals(counts: SITE_SIGNALS_QUERY_RESULT | null | undefined): SiteSignals {
  return {
    hasPodcasts: (counts?.podcasts ?? 0) > 0,
    hasVideos: (counts?.videos ?? 0) > 0,
    singleAuthor: (counts?.authors ?? 0) <= 1,
  };
}
