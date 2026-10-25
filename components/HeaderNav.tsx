"use client";

import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { useEffect, useRef } from "react";
import type { NavLink } from "@/lib/nav-links";
import { MenuLink } from "./MenuLink";

type School = { _id: string; slug: string | null; shortName: string | null; name: string | null };

/** Which media sections have anything published. Their links stay hidden until they do. */
export type MediaSections = { podcasts: boolean; videos: boolean };

type Section = { href: string; segment: string; label: string; school: string | null };

/**
 * The automatic section links, in reader order (docs/specs/phase-1-ux-update.md, 5.1): National, the schools in
 * Site settings > Navigation, Podcasts and Videos once each has published something, then Community.
 */
export function sectionLinks(schools: School[], media: MediaSections): Section[] {
  return [
    { href: "/national", segment: "national", label: "National", school: null },
    ...schools
      .filter((s): s is School & { slug: string } => Boolean(s.slug))
      .map((s) => ({ href: `/${s.slug}`, segment: s.slug, label: s.shortName ?? s.name ?? s.slug, school: s.slug })),
    ...(media.podcasts ? [{ href: "/podcasts", segment: "podcasts", label: "Podcasts", school: null }] : []),
    ...(media.videos ? [{ href: "/videos", segment: "videos", label: "Videos", school: null }] : []),
    { href: "/community", segment: "community", label: "Community", school: null },
  ];
}

/**
 * Desktop section links, on their own row under the wordmark so the masthead never crowds. The current section is
 * marked with aria-current and a 3px rule in its color.
 */
export function HeaderNav({ schools, media }: { schools: School[]; media: MediaSections }) {
  const segment = useSelectedLayoutSegment();
  const items = sectionLinks(schools, media);

  return (
    <nav aria-label="Sections" className="flex justify-center gap-10">
      {items.map((item) => {
        const current = segment === item.segment;
        return (
          <Link
            key={item.href}
            href={item.href}
            data-school={item.school ?? undefined}
            aria-current={current ? "page" : undefined}
            // One step above the 12px kickers on cards, so navigation does not read as a label (design sweep F17).
            className={`relative py-3.5 font-ui text-[0.8125rem] font-semibold uppercase tracking-[0.06em] no-underline transition-colors ${
              current
                ? "text-fg after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-accent"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Phone menu. A native <details> so it works before hydration; it closes itself after navigation. */
export function MobileMenu({ schools, media, extraLinks }: { schools: School[]; media: MediaSections; extraLinks: NavLink[] }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  const links = [...sectionLinks(schools, media), ...extraLinks];
  const cls = "flex h-11 items-center px-3 font-ui text-[0.9375rem] text-fg no-underline hover:bg-bg";

  return (
    <details ref={ref} className="group/menu relative md:hidden">
      <summary
        aria-label="Menu"
        className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-base border border-line text-fg [&::-webkit-details-marker]:hidden"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" className="group-open/menu:hidden" />
          <path d="M6 6l12 12M18 6L6 18" className="hidden group-open/menu:block" />
        </svg>
      </summary>
      <nav
        aria-label="Menu"
        className="absolute right-0 top-12 z-20 w-64 border border-line bg-bg-elev p-2 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.25)]"
      >
        {links.map((l, i) => (
          <MenuLink key={`${i}-${l.href}`} href={l.href} className={cls}>
            {l.label}
          </MenuLink>
        ))}
      </nav>
    </details>
  );
}
