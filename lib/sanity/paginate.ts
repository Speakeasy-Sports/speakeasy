/**
 * GROQ slices cannot take parameters, and TypeGen can only type literal queries. So paginated queries are written
 * with their first-page slice (for example `[0...20]`) and this swaps that one slice for the requested page.
 * The marker must occur exactly once in the query; a second match would silently page the wrong list.
 */
export function pageQuery<const Q extends string>(query: Q, marker: string, page: number, perPage: number): Q {
  const first = query.indexOf(marker);
  if (first === -1 || query.indexOf(marker, first + marker.length) !== -1) {
    throw new Error(`pageQuery: marker ${marker} must appear exactly once`);
  }
  if (page === 1) return query;
  const start = (page - 1) * perPage;
  return query.replace(marker, `[${start}...${start + perPage}]`) as Q;
}

/** Parses a `page` search param into a positive integer, or null when it is not one (so the page can 404). */
export function parsePage(raw: string | string[] | undefined): number | null {
  if (raw === undefined) return 1;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !/^[1-9]\d{0,3}$/.test(value)) return null;
  return Number(value);
}

export function totalPages(count: number, perPage: number): number {
  return Math.max(1, Math.ceil(count / perPage));
}
