import { accentForeground, isHex } from "@/lib/color";

type Props = {
  slug: string | null | undefined;
  accentColor: string | null | undefined;
  accentColorDark?: string | null;
};

/**
 * Emits the accent tokens for one school section from CMS values. Georgia is also in tokens.css;
 * CMS values win when both exist because this style tag comes later in the document.
 * Values are validated as six-digit hex so nothing else can reach the stylesheet.
 */
export function SchoolTheme({ slug, accentColor, accentColorDark }: Props) {
  if (!slug || !/^[a-z0-9-]+$/.test(slug) || !isHex(accentColor)) return null;
  const light = accentColor.toLowerCase();
  const dark = isHex(accentColorDark) ? accentColorDark.toLowerCase() : light;
  const sel = `[data-school="${slug}"]`;
  const css =
    `${sel}{--accent:${light};--accent-fg:${accentForeground(light)}}` +
    `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) ${sel}{--accent:${dark};--accent-fg:${accentForeground(dark, true)}}}` +
    `:root[data-theme="dark"] ${sel}{--accent:${dark};--accent-fg:${accentForeground(dark, true)}}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
