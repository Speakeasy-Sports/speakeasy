export function PullQuote({ text, attribution }: { text: string | null | undefined; attribution?: string | null }) {
  if (!text) return null;
  return (
    <aside className="my-10 border-y border-line py-6">
      <p className="font-display text-2xl leading-snug text-fg md:text-3xl">{text}</p>
      {attribution && <p className="mt-3 font-ui text-sm text-fg-muted">{attribution}</p>}
    </aside>
  );
}
