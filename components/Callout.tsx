type Props = {
  title?: string | null;
  body: string | null | undefined;
  variant?: string | null;
};

export function Callout({ title, body, variant }: Props) {
  if (!body) return null;
  const isNote = variant === "note";
  return (
    <aside className={`my-8 border-b border-line py-4 font-ui text-base ${isNote ? "border-t" : "border-t-[3px] border-t-accent"}`}>
      {title && <p className="label-caps mb-1 text-accent">{title}</p>}
      <p className="whitespace-pre-line text-fg">{body}</p>
    </aside>
  );
}
