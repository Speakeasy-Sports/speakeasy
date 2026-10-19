type Props = {
  kicker?: string | null;
  title: string;
  intro?: string | null;
  children?: React.ReactNode;
};

/** Header for index pages (podcasts, videos, tags, search, info pages). */
export function PageHeader({ kicker, title, intro, children }: Props) {
  return (
    <header className="flex flex-col gap-4 border-b border-line pb-8 pt-10 sm:pt-14">
      {kicker && <p className="label-caps text-accent">{kicker}</p>}
      <h1 className="headline text-[2.75rem] leading-[0.98] tracking-[-0.03em] sm:text-[4rem]">{title}</h1>
      {intro && <p className="max-w-2xl text-lg leading-snug text-fg-muted sm:text-xl">{intro}</p>}
      {children}
    </header>
  );
}
