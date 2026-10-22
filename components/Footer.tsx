import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { schoolPath } from "@/lib/seo";
import { DEFAULT_LEGAL_LINKS, resolveFooterColumns, resolveLinks } from "@/lib/nav-links";
import type { MediaSections } from "./HeaderNav";
import { MenuLink } from "./MenuLink";

const PLATFORM_LABELS: Record<string, string> = {
  x: "X",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  threads: "Threads",
  bluesky: "Bluesky",
  website: "Website",
};

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="label-caps text-fg-muted">{title}</h2>
      <ul className="flex flex-col gap-2.5 font-ui text-[0.9375rem]">{children}</ul>
    </div>
  );
}

function Item({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <MenuLink href={href} className="text-fg no-underline transition-colors hover:text-fg-muted">
        {children}
      </MenuLink>
    </li>
  );
}

// Sections, up to two editable columns, and Follow. Literal classes so Tailwind sees them.
const GRID_COLS: Record<number, string> = {
  1: "sm:grid-cols-2",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

type Props = { settings: SiteSettings | null; signoff: string; media: MediaSections };

export function Footer({ settings, signoff, media }: Props) {
  const year = new Date().getFullYear();
  const siteName = settings?.siteName ?? "Speakeasy Sports";
  const schools = (settings?.navSchools ?? []).filter((s) => s.slug);
  const socials = (settings?.socialLinks ?? []).filter((s) => s.url);
  const columns = resolveFooterColumns(settings?.footerColumns);
  const legal = resolveLinks(settings?.legalLinks, DEFAULT_LEGAL_LINKS);
  const columnCount = 1 + columns.length + (socials.length > 0 ? 1 : 0);

  return (
    // A page that ends in the newsletter band runs straight into the footer rule instead of leaving a strip of paper.
    <footer className="mt-24 border-t border-fg bg-bg [main:has([data-newsletter-band])+&]:mt-0">
      <div className="shell py-14">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="flex flex-col gap-4 md:col-span-5">
            <Link href="/" className="font-display text-[2rem] font-bold leading-none tracking-[-0.03em] no-underline">
              {siteName}
            </Link>
            {settings?.tagline && <p className="max-w-sm text-lg leading-snug text-fg-muted">{settings.tagline}</p>}
          </div>
          <nav aria-label="Footer" className={`grid grid-cols-2 gap-10 md:col-span-7 ${GRID_COLS[columnCount] ?? GRID_COLS[3]}`}>
            <Column title="Sections">
              {schools.map((s) => (
                <Item key={s._id} href={schoolPath(s.slug!)}>
                  {s.name}
                </Item>
              ))}
              {media.podcasts && <Item href="/podcasts">Podcasts</Item>}
              {media.videos && <Item href="/videos">Videos</Item>}
              <Item href="/search">Search</Item>
            </Column>
            {columns.map((c, i) => (
              <Column key={`${i}-${c.title}`} title={c.title}>
                {c.links.map((l, j) => (
                  <Item key={`${j}-${l.href}`} href={l.href}>
                    {l.label}
                  </Item>
                ))}
              </Column>
            ))}
            {socials.length > 0 && (
              <Column title="Follow">
                {socials.map((s) => (
                  <Item key={s._key} href={s.url!}>
                    {PLATFORM_LABELS[s.platform ?? ""] ?? s.platform}
                  </Item>
                ))}
              </Column>
            )}
          </nav>
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-6 font-ui text-[0.8125rem] text-fg-subtle md:flex-row md:items-center md:justify-between">
          <p>{settings?.footerText ?? `${siteName} is an independent publication and is not affiliated with any university.`}</p>
          <p className="flex flex-wrap gap-x-5 gap-y-2">
            <span>
              &copy; {year} {siteName}. {signoff}
            </span>
            {legal.map((l, i) => (
              <MenuLink key={`${i}-${l.href}`} href={l.href} className="text-fg-subtle no-underline hover:text-fg">
                {l.label}
              </MenuLink>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
