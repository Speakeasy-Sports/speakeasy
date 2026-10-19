import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { schoolPath } from "@/lib/seo";

const PLATFORM_LABELS: Record<string, string> = {
  x: "X",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  threads: "Threads",
  bluesky: "Bluesky",
  website: "Website",
};

export function Footer({ settings }: { settings: SiteSettings | null }) {
  const year = new Date().getFullYear();
  const siteName = settings?.siteName ?? "Speakeasy Sports";
  const schools = settings?.navSchools ?? [];
  const socials = (settings?.socialLinks ?? []).filter((s) => s.url);

  return (
    <footer className="mt-16 border-t border-line bg-bg">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 font-ui text-sm text-fg-muted sm:grid-cols-3">
        <div>
          <p className="font-display text-lg font-semibold text-fg">{siteName}</p>
          {settings?.tagline && <p className="mt-1">{settings.tagline}</p>}
          <p className="mt-3">Built for fans.</p>
        </div>

        <nav aria-label="Sections" className="flex flex-col gap-2">
          {schools.map((s) => (
            <Link key={s._id} href={schoolPath(s.slug ?? "")} className="no-underline hover:text-fg">
              {s.name}
            </Link>
          ))}
          <Link href="/podcasts" className="no-underline hover:text-fg">
            Podcasts
          </Link>
          <Link href="/videos" className="no-underline hover:text-fg">
            Videos
          </Link>
          <Link href="/newsletter" className="no-underline hover:text-fg">
            Newsletter
          </Link>
        </nav>

        <div className="flex flex-col gap-2">
          {socials.length > 0 && (
            <ul className="flex flex-wrap gap-4">
              {socials.map((s) => (
                <li key={s._key}>
                  <a href={s.url ?? "#"} rel="noopener noreferrer" target="_blank" className="no-underline hover:text-fg">
                    {PLATFORM_LABELS[s.platform ?? ""] ?? s.platform}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-4">
            <Link href="/about" className="no-underline hover:text-fg">
              About
            </Link>
            <Link href="/contact" className="no-underline hover:text-fg">
              Contact
            </Link>
            <Link href="/terms" className="no-underline hover:text-fg">
              Terms
            </Link>
            <Link href="/privacy" className="no-underline hover:text-fg">
              Privacy
            </Link>
          </div>
          <p className="mt-2 text-fg-subtle">
            {settings?.footerText ?? `${siteName} is an independent publication and is not affiliated with any university.`}
          </p>
          <p className="text-fg-subtle">
            &copy; {year} {siteName}
          </p>
        </div>
      </div>
    </footer>
  );
}
