import Link from "next/link";

type Chip = { key: string; label: string; href: string; active: boolean; school?: string | null };

/** School filter for podcasts, videos, and tags. Plain links, so filtered views are shareable and need no JS. */
export function FilterChips({ chips, label }: { chips: Chip[]; label: string }) {
  if (chips.length <= 2) return null;
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <Link
          key={c.key}
          href={c.href}
          data-school={c.school ?? undefined}
          aria-current={c.active ? "page" : undefined}
          className={`inline-flex h-11 items-center rounded-full sm:h-9 border px-4 font-ui text-[0.8125rem] font-medium no-underline transition-colors ${
            c.active ? "border-fg bg-fg text-bg" : "border-line bg-bg-elev text-fg hover:border-fg"
          }`}
        >
          {c.label}
        </Link>
      ))}
    </nav>
  );
}
