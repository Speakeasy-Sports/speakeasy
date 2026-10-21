import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { HeaderNav, MobileMenu, type MediaSections } from "./HeaderNav";
import { JoinButton } from "./JoinButton";

type Props = {
  settings: SiteSettings | null;
  joinUrl: string;
  media: MediaSections;
};

/**
 * Masthead. Desktop: sections left, wordmark centered, search and Join right.
 * Phones (AGENTS.md section 9): wordmark, Join, menu.
 */
export function SiteHeader({ settings, joinUrl, media }: Props) {
  const schools = settings?.navSchools ?? [];
  const siteName = settings?.siteName ?? "Speakeasy Sports";

  return (
    <header className="border-b border-line bg-bg">
      <div className="shell grid h-16 grid-cols-[1fr_auto] items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <HeaderNav schools={schools} media={media} />
        <Link
          href="/"
          className="font-display text-[1.375rem] font-bold leading-none tracking-[-0.03em] no-underline md:justify-self-center md:text-[1.625rem]"
        >
          {siteName}
        </Link>
        <div className="flex items-center gap-2 justify-self-end">
          <Link
            href="/search"
            aria-label="Search"
            className="hidden h-10 w-10 items-center justify-center rounded-base text-fg-muted no-underline transition-colors hover:text-fg md:inline-flex"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="M16 16l4.5 4.5" />
            </svg>
          </Link>
          <JoinButton href={joinUrl} location="header" />
          <MobileMenu schools={schools} media={media} />
        </div>
      </div>
    </header>
  );
}
