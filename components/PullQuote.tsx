/** Set apart from the body by an accent rule and the display italic, so it reads as a deliberate break. */
export function PullQuote({ text, attribution }: { text: string | null | undefined; attribution?: string | null }) {
  if (!text) return null;
  return (
    <aside className="my-12">
      <span aria-hidden="true" className="block h-[3px] w-10 bg-accent" />
      <p className="mt-5 text-balance font-display text-2xl font-medium italic leading-snug text-fg md:text-[2rem]">{text}</p>
      {attribution && <p className="label-caps mt-4 text-fg-muted">{attribution}</p>}
    </aside>
  );
}
