import Link from "next/link";

type Props = { title: string; body: string };

/** End of national stories, and of stories from a school without a club: a pointer to /community, never a signup. */
export function CommunityInvite({ title, body }: Props) {
  return (
    <section className="flex flex-col gap-3 font-ui sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div>
        <h2 className="text-base font-semibold text-fg">{title}</h2>
        <p className="mt-1 text-sm text-fg-muted">{body}</p>
      </div>
      <Link
        href="/community"
        className="inline-flex h-10 shrink-0 items-center justify-center self-start whitespace-nowrap rounded-base border border-fg px-4 text-sm font-semibold text-fg no-underline transition-opacity hover:opacity-90 sm:self-auto"
      >
        {title}
      </Link>
    </section>
  );
}
