// Front-page selection (docs/specs/phase-1-ux-update.md, 4.1). Pure, unit tested.

export type FrontPicks = { pinned: string | null; newest: string[] } | null | undefined;
export type FrontSelection = { lead: string | null; supporting: string[] };

/** Supporting stories under the lead. Compact fronts fold them back into Latest (components/FrontPage.tsx). */
export const SUPPORTING_COUNT = 3;

/**
 * The lead is the curated homepageLead when it is live on this front, otherwise the newest story. Supporting stories
 * are the newest after it. `newest` holds one more than SUPPORTING_COUNT, so there are always enough once the lead is
 * taken out, whichever story it is.
 */
export function selectFront(picks: FrontPicks): FrontSelection {
  const newest = picks?.newest ?? [];
  const lead = picks?.pinned ?? newest[0] ?? null;
  return { lead, supporting: newest.filter((id) => id !== lead).slice(0, SUPPORTING_COUNT) };
}
