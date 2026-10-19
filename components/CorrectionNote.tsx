export function CorrectionNote({ text }: { text: string | null | undefined }) {
  if (!text) return null;
  return (
    <aside aria-label="Correction" className="measure mt-10 border-l-2 border-fg-subtle pl-4 font-ui text-sm text-fg-muted">
      <p className="label-caps mb-1 text-fg-subtle">Correction</p>
      <p className="whitespace-pre-line">{text}</p>
    </aside>
  );
}
