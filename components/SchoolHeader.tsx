import { JoinButton } from "./JoinButton";
import { SchoolNav } from "./SchoolNav";
import type { MediaSections } from "./HeaderNav";

type Props = {
  school: {
    slug: string;
    name?: string | null;
    shortName?: string | null;
    communityName?: string | null;
    description?: string | null;
  };
  navTags?: Array<{ _id: string; name: string | null; slug: string | null }> | null;
  joinUrl: string;
  active: string;
  media: MediaSections;
  /** "front" on the section front; "compact" on podcasts, videos, and tags filtered to the school. */
  variant?: "front" | "compact";
  /** Overrides the large title, for example "Recruiting" on a tag page inside the section. */
  title?: string;
};

export function SchoolHeader({ school, navTags, joinUrl, active, media, variant = "front", title }: Props) {
  const compact = variant === "compact";
  return (
    <header className={compact ? "pt-8" : "pt-10 sm:pt-14"}>
      <div className="flex flex-col gap-6 pb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
        <div className="flex min-w-0 flex-col gap-3">
          <p className="label-caps text-accent">{compact ? (school.name ?? school.shortName) : school.communityName}</p>
          <h1
            className={`headline ${
              compact
                ? "text-[2.25rem] leading-none sm:text-[3rem]"
                : "text-[3rem] leading-[0.95] tracking-[-0.035em] sm:text-[4.5rem] lg:text-[5.5rem]"
            }`}
          >
            {title ?? school.name}
          </h1>
        </div>
        <div className="flex flex-col items-start gap-4 sm:max-w-sm sm:items-end sm:text-right">
          {!compact && school.description && <p className="font-ui text-[0.9375rem] leading-relaxed text-fg-muted">{school.description}</p>}
          <JoinButton href={joinUrl} location="school_header">
            Join {school.communityName ?? "the Club"}
          </JoinButton>
        </div>
      </div>
      <div className="border-t-[3px] border-accent" />
      <SchoolNav school={school} navTags={navTags} active={active} media={media} />
    </header>
  );
}
