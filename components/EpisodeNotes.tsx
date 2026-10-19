type Timestamp = { _key: string; time: string | null; label: string | null };

export function EpisodeNotes({
  summary,
  timestamps,
}: {
  summary: string | null | undefined;
  timestamps: Timestamp[] | null | undefined;
}) {
  const stamps = (timestamps ?? []).filter((t) => t.time && t.label);
  if (!summary && stamps.length === 0) return null;

  return (
    <section aria-label="Episode notes" className="measure mt-6 font-ui">
      {summary && <p className="whitespace-pre-line text-base text-fg-muted">{summary}</p>}
      {stamps.length > 0 && (
        <ol className="mt-4 divide-y divide-line border-y border-line text-sm">
          {stamps.map((t) => (
            <li key={t._key} className="flex gap-4 py-2">
              <span className="w-16 shrink-0 tabular-nums text-accent">{t.time}</span>
              <span>{t.label}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
