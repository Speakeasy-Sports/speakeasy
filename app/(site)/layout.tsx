import { getSiteSettings, getSiteSignals } from "@/lib/sanity/loaders";
import { joinUrlFor } from "@/lib/circle-links";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { SchoolTheme } from "@/components/SchoolTheme";

// Pages set their own width (`shell`) so full-bleed bands such as the newsletter can run edge to edge.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, signals] = await Promise.all([getSiteSettings(), getSiteSignals()]);
  const media = { podcasts: signals.hasPodcasts, videos: signals.hasVideos };
  return (
    <>
      {/* Accent tokens for every school in the nav, so story labels carry their school's color on any page. */}
      {(settings?.navSchools ?? []).map((s) => (
        <SchoolTheme key={s._id} slug={s.slug} accentColor={s.accentColor} accentColorDark={s.accentColorDark} />
      ))}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-base focus:bg-bg-elev focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <SiteHeader settings={settings} joinUrl={joinUrlFor(null, settings)} media={media} />
      <main id="main">{children}</main>
      <Footer settings={settings} media={media} />
    </>
  );
}
