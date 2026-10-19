import Link from "next/link";

type Props = {
  page: number;
  total: number;
  /** Builds the URL for a page number. Page 1 should be the unpaginated URL. */
  href: (page: number) => string;
  label?: string;
};

/** Newer and Older links around a "Page 2 of 6" readout. Renders nothing when everything fits on one page. */
export function Pagination({ page, total, href, label = "Pagination" }: Props) {
  if (total <= 1) return null;
  const linkClass =
    "inline-flex h-11 items-center gap-2 rounded-base border border-line bg-bg-elev px-4 font-ui text-sm font-medium text-fg no-underline transition-colors hover:border-fg";
  const dead = "inline-flex h-11 items-center gap-2 px-4 font-ui text-sm text-fg-subtle";

  return (
    <nav aria-label={label} className="flex items-center justify-between gap-4 border-t border-line pt-6">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={linkClass}>
          <span aria-hidden="true">&larr;</span> Newer
        </Link>
      ) : (
        <span className={dead} aria-hidden="true">
          &larr; Newer
        </span>
      )}
      <p className="font-ui text-sm tabular-nums text-fg-muted">
        Page {page} of {total}
      </p>
      {page < total ? (
        <Link href={href(page + 1)} rel="next" className={linkClass}>
          Older <span aria-hidden="true">&rarr;</span>
        </Link>
      ) : (
        <span className={dead} aria-hidden="true">
          Older &rarr;
        </span>
      )}
    </nav>
  );
}
