type Props = {
  title?: string | null;
  body: string | null | undefined;
  variant?: string | null;
};

export function Callout({ title, body, variant }: Props) {
  if (!body) return null;
  const isNote = variant === "note";
  return (
    <aside
      className={`my-8 rounded-base border px-5 py-4 font-ui text-base ${isNote ? "border-line bg-bg-elev" : "border-accent/30 bg-accent/5"}`}
    >
      {title && <p className="label-caps mb-1 text-accent">{title}</p>}
      <p className="whitespace-pre-line text-fg">{body}</p>
    </aside>
  );
}
