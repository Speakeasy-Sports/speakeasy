// sitemap.xml as plain XML (AGENTS.md section 6). Pure, unit tested.
//
// The site serves this from a route handler, not app/sitemap.ts: Next caches the sitemap metadata route as a static
// file that, on Vercel, refreshed neither on its revalidate interval nor on revalidateTag, so new articles and
// schools never appeared. Route handlers (like /feed.xml) revalidate normally.
export type SitemapEntry = {
  url: string;
  lastModified?: string | null;
  changeFrequency?: "hourly" | "daily" | "weekly";
  priority?: number;
};

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export function sitemapXml(entries: SitemapEntry[]): string {
  const urls = entries.map((e) => {
    const parts = [`<loc>${escapeXml(e.url)}</loc>`];
    if (e.lastModified) {
      const d = new Date(e.lastModified);
      if (!Number.isNaN(d.getTime())) parts.push(`<lastmod>${d.toISOString()}</lastmod>`);
    }
    if (e.changeFrequency) parts.push(`<changefreq>${e.changeFrequency}</changefreq>`);
    if (e.priority !== undefined) parts.push(`<priority>${e.priority}</priority>`);
    return `<url>${parts.join("")}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}
