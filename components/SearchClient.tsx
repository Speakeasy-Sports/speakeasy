"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { contentTypeLabel } from "@/lib/content-types";
import { formatLongDate } from "@/lib/format/date";
import { highlight, search, type IndexEntry } from "@/lib/search";

/**
 * Search over /search-index.json, fetched once on mount. The query lives in the URL (?q=) so results are
 * shareable and survive a reload, without a server round trip per keystroke.
 */
export function SearchClient() {
  const id = useId();
  const params = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [index, setIndex] = useState<IndexEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const startedEmpty = useRef(query === "");

  useEffect(() => {
    if (startedEmpty.current) inputRef.current?.focus();
    fetch("/search-index.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: IndexEntry[]) => setIndex(data))
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  }, [query]);

  const hits = useMemo(() => (index ? search(index, query) : []), [index, query]);
  const recent = useMemo(() => (index ? index.slice(0, 6) : []), [index]);
  const trimmed = query.trim();

  return (
    <div className="flex flex-col gap-10">
      <form role="search" onSubmit={(e) => e.preventDefault()} className="relative">
        <label htmlFor={`${id}-q`} className="sr-only">
          Search stories
        </label>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-fg-subtle"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" />
        </svg>
        <input
          ref={inputRef}
          id={`${id}-q`}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Players, opponents, topics, writers"
          autoComplete="off"
          spellCheck={false}
          className="h-16 w-full border-0 border-b-2 border-fg bg-transparent pl-10 font-display text-2xl tracking-tight text-fg placeholder:text-fg-subtle focus:outline-none sm:h-20 sm:text-[2rem]"
        />
      </form>

      <div aria-live="polite" className="font-ui text-sm text-fg-muted">
        {failed
          ? "Search is unavailable right now."
          : !index
            ? trimmed
              ? "Loading"
              : ""
            : trimmed
              ? hits.length === 0
                ? `No stories match “${trimmed}”.`
                : `${hits.length === 50 ? "50+" : hits.length} ${hits.length === 1 ? "story" : "stories"}`
              : ""}
      </div>

      {trimmed && hits.length > 0 && (
        <ol className="divide-y divide-line border-t border-line">
          {hits.map(({ entry }) => (
            <li key={entry.u} data-school={entry.u.split("/")[1]} className="py-6">
              <p className="label-caps flex gap-2.5 text-accent">
                <span>{contentTypeLabel(entry.k)}</span>
                {entry.s && (
                  <>
                    <span aria-hidden="true" className="text-fg-subtle">
                      &middot;
                    </span>
                    <span>{entry.s}</span>
                  </>
                )}
              </p>
              <h2 className="headline mt-2 text-[1.375rem] leading-[1.2] sm:text-2xl">
                <Link href={entry.u} className="story-link">
                  {highlight(entry.t ?? "", query).map((run, i) =>
                    run.match ? (
                      <mark key={i} className="bg-transparent text-fg underline decoration-accent decoration-2 underline-offset-[0.18em]">
                        {run.text}
                      </mark>
                    ) : (
                      <span key={i}>{run.text}</span>
                    ),
                  )}
                </Link>
              </h2>
              {entry.d && <p className="mt-2 max-w-3xl text-base leading-snug text-fg-muted">{entry.d}</p>}
              <p className="mt-3 font-ui text-[0.8125rem] text-fg-subtle">
                {(entry.a ?? []).filter(Boolean).join(", ")}
                {entry.p && (
                  <>
                    {" "}
                    &middot; <time dateTime={entry.p}>{formatLongDate(entry.p)}</time>
                  </>
                )}
              </p>
            </li>
          ))}
        </ol>
      )}

      {!trimmed && recent.length > 0 && (
        <section aria-labelledby={`${id}-recent`}>
          <h2 id={`${id}-recent`} className="rule-heading">
            Recent stories
          </h2>
          <ul className="divide-y divide-line">
            {recent.map((e) => (
              <li key={e.u} className="flex items-baseline justify-between gap-6 py-4">
                <Link href={e.u} className="story-link headline text-lg leading-snug">
                  {e.t}
                </Link>
                {e.p && (
                  <time dateTime={e.p} className="hidden shrink-0 font-ui text-[0.8125rem] text-fg-subtle sm:block">
                    {formatLongDate(e.p)}
                  </time>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
