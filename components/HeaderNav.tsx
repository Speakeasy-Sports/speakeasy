"use client";

import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { useEffect, useRef } from "react";

type School = { _id: string; slug: string | null; shortName: string | null; name: string | null };

const SECTIONS = [
  { href: "/podcasts", segment: "podcasts", label: "Podcasts" },
  { href: "/videos", segment: "videos", label: "Videos" },
];

/** Desktop section links. The current school or section is marked with aria-current and an accent rule. */
export function HeaderNav({ schools }: { schools: School[] }) {
  const segment = useSelectedLayoutSegment();
  const items = [
    ...schools.filter((s) => s.slug).map((s) => ({ href: `/${s.slug}`, segment: s.slug, label: s.shortName ?? s.name, school: s.slug })),
    ...SECTIONS.map((s) => ({ ...s, school: null })),
  ];

  return (
    <nav aria-label="Sections" className="hidden items-center gap-6 md:flex">
      {items.map((item) => {
        const current = segment === item.segment;
        return (
          <Link
            key={item.href}
            href={item.href}
            data-school={item.school ?? undefined}
            aria-current={current ? "page" : undefined}
            className={`label-caps relative py-5 no-underline transition-colors ${
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
export function MobileMenu({ schools }: { schools: School[] }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  const links = [
    ...schools.filter((s) => s.slug).map((s) => ({ href: `/${s.slug}`, label: s.name ?? s.shortName ?? "" })),
    { href: "/podcasts", label: "Podcasts" },
    { href: "/videos", label: "Videos" },
    { href: "/search", label: "Search" },
    { href: "/newsletter", label: "Newsletter" },
  ];

  return (
    <details ref={ref} className="group/menu relative md:hidden">
      <summary
        aria-label="Menu"
        className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-base border border-line text-fg [&::-webkit-details-marker]:hidden"
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
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="flex h-11 items-center px-3 font-ui text-[0.9375rem] text-fg no-underline hover:bg-bg">
            {l.label}
          </Link>
        ))}
      </nav>
    </details>
  );
}
