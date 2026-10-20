import type { Sponsor } from "@/lib/types";
import { SanityImage } from "./SanityImage";

/** Renders only when the query found an active, matching slot. Never an empty box. */
export function SponsorSlot({ sponsor }: { sponsor: Sponsor | null | undefined }) {
  if (!sponsor?.url || !sponsor.sponsorName) return null;
  return (
    <aside
      aria-label="Sponsor"
      className="measure my-8 flex items-center gap-4 border-y border-line py-3 font-ui"
    >
      {sponsor.logo?.asset && (
        <span className="h-10 w-10 shrink-0 overflow-hidden">
          <SanityImage image={sponsor.logo} width={40} aspect={1} sizes="40px" className="h-full w-full object-contain" />
        </span>
      )}
      <div className="min-w-0 text-sm">
        <p className="label-caps text-fg-subtle">{sponsor.label ?? "Presented by"}</p>
        <a href={sponsor.url} rel="sponsored noopener noreferrer" target="_blank" className="font-semibold no-underline hover:underline">
          {sponsor.sponsorName}
        </a>
        {sponsor.headline && <p className="text-fg-muted">{sponsor.headline}</p>}
      </div>
    </aside>
  );
}
