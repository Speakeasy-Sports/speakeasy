import { getSiteSettings } from "@/lib/sanity/loaders";
import { joinUrlFor } from "@/lib/circle-links";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-base focus:bg-bg-elev focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <SiteHeader settings={settings} joinUrl={joinUrlFor(null, settings)} />
      <main id="main" className="mx-auto w-full max-w-6xl px-4">
        {children}
      </main>
      <Footer settings={settings} />
    </>
  );
}
