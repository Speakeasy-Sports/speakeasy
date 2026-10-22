/**
 * Editable menus from Site settings > Navigation: the phone menu extras, the footer link columns, and the legal links.
 * An empty list in the Studio means "use the default", so the site never renders a blank menu.
 * The section links (schools, Podcasts, Videos) stay automatic and are not part of these lists.
 */
export type NavLink = { label: string; href: string };
export type FooterColumn = { title: string; links: NavLink[] };

type RawLink = { label?: string | null; href?: string | null } | null | undefined;
type RawColumn = { title?: string | null; links?: RawLink[] | null } | null | undefined;

export const DEFAULT_MENU_LINKS: NavLink[] = [
  { label: "Search", href: "/search" },
  { label: "Newsletter", href: "/newsletter" },
];

export const DEFAULT_FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Speakeasy",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Newsletter", href: "/newsletter" },
      { label: "Write for us", href: "/write-for-us" },
      { label: "RSS", href: "/feed.xml" },
    ],
  },
];

export const DEFAULT_LEGAL_LINKS: NavLink[] = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
];

/** A site path ("/newsletter"), an https URL, or a mailto link. Protocol-relative "//host" is not a site path. */
export function isValidHref(href: string): boolean {
  if (/^\/(?!\/)/.test(href)) return true;
  if (/^mailto:[^\s@]+@[^\s@]+$/.test(href)) return true;
  try {
    return new URL(href).protocol === "https:";
  } catch {
    return false;
  }
}

export function isExternalHref(href: string): boolean {
  return !href.startsWith("/");
}

function cleanLinks(raw: RawLink[] | null | undefined): NavLink[] {
  return (raw ?? [])
    .map((l) => ({ label: l?.label?.trim() ?? "", href: l?.href?.trim() ?? "" }))
    .filter((l) => l.label && isValidHref(l.href));
}

export function resolveLinks(raw: RawLink[] | null | undefined, defaults: NavLink[]): NavLink[] {
  const links = cleanLinks(raw);
  return links.length > 0 ? links : defaults;
}

export function resolveFooterColumns(raw: RawColumn[] | null | undefined): FooterColumn[] {
  const columns = (raw ?? [])
    .map((c) => ({ title: c?.title?.trim() ?? "", links: cleanLinks(c?.links) }))
    .filter((c) => c.title && c.links.length > 0);
  return columns.length > 0 ? columns : DEFAULT_FOOTER_COLUMNS;
}
