import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import type { NavLink } from "@/lib/nav-links";
import { HeaderNav, MobileMenu, type MediaSections } from "./HeaderNav";

type Props = {
  settings: SiteSettings | null;
  newsletterLabel: string;
  /** Phone menu links after the sections, from Site settings > Navigation. */
  menuLinks: NavLink[];
  media: MediaSections;
};

/**
 * Masthead (docs/specs/phase-1-ux-update.md, 5.1). Desktop: wordmark centered, Search and Newsletter right, section
 * links on a second row. Phones: wordmark, Newsletter, menu. Newsletter is the one filled button; joining a club is
 * offered on school pages and /community, not here.
 */
export function SiteHeader({ settings, newsletterLabel, menuLinks, media }: Props) {
  const schools = settings?.navSchools ?? [];
  const siteName = settings?.siteName ?? "Speakeasy Sports";

  return (
    <header className="border-b border-line bg-bg">
      <div className="shell grid h-16 grid-cols-[1fr_auto] items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <span aria-hidden="true" className="hidden md:block" />
        <Link
          href="/"
          className="font-display text-[1.375rem] font-semibold leading-none tracking-[-0.02em] no-underline md:justify-self-center md:text-[1.75rem] md:tracking-[-0.03em]"
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
          <Link
            href="/newsletter"
            className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-base bg-fg px-4 font-ui text-sm font-semibold text-bg no-underline transition-colors hover-ink-shift md:h-10"
          >
            {newsletterLabel}
          </Link>
          <MobileMenu schools={schools} media={media} extraLinks={menuLinks} />
        </div>
      </div>
      <div className="hidden border-t border-line md:block">
        <div className="shell">
          <HeaderNav schools={schools} media={media} />
        </div>
      </div>
    </header>
  );
}
