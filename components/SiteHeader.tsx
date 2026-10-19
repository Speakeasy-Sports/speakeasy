import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { schoolPath } from "@/lib/seo";
import { JoinButton } from "./JoinButton";

type Props = {
  settings: SiteSettings | null;
  /** Slug of the school section in context, if any. */
  currentSchool?: string | null;
  joinUrl: string;
};

export function SiteHeader({ settings, currentSchool, joinUrl }: Props) {
  const schools = settings?.navSchools ?? [];
  const siteName = settings?.siteName ?? "Speakeasy Sports";

  return (
    <header className="border-b border-line bg-bg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight no-underline">
          {siteName}
        </Link>

        {schools.length > 0 && (
          <nav aria-label="Schools" className="hidden xs:flex items-center gap-5">
            {schools.map((s) => (
              <Link
                key={s._id}
                href={schoolPath(s.slug ?? "")}
                aria-current={currentSchool === s.slug ? "page" : undefined}
                className={`label-caps no-underline ${currentSchool === s.slug ? "text-accent" : "text-fg-muted hover:text-fg"}`}
              >
                {s.shortName ?? s.name}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <JoinButton href={joinUrl} location="header" />
          {schools.length > 0 && (
            <details className="relative xs:hidden">
              <summary
                className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-base border border-line [&::-webkit-details-marker]:hidden"
                aria-label="Menu"
              >
                <span aria-hidden className="block h-0.5 w-4 bg-fg shadow-[0_5px_0_var(--fg),0_-5px_0_var(--fg)]" />
              </summary>
              <nav
                aria-label="Schools"
                className="absolute right-0 top-11 z-10 min-w-40 rounded-base border border-line bg-bg-elev p-2 shadow-lg"
              >
                {schools.map((s) => (
                  <Link
                    key={s._id}
                    href={schoolPath(s.slug ?? "")}
                    className="block rounded-base px-3 py-2 font-ui text-sm no-underline hover:bg-bg"
                  >
                    {s.name}
                  </Link>
                ))}
              </nav>
            </details>
          )}
        </div>
      </div>
    </header>
  );
}
