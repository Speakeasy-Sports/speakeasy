import Link from "next/link";
import { schoolPath, tagPath } from "@/lib/seo";

type NavTag = { _id: string; name: string | null; slug: string | null };

type Props = {
  school: { slug: string; shortName?: string | null; name?: string | null };
  navTags?: NavTag[] | null;
  /** "latest", "podcasts", "videos", or a tag slug. */
  active: string;
};

/**
 * Section sub-nav (AGENTS.md section 6): Latest, Podcasts, Videos, then the school's curated tags.
 * Podcasts, videos, and tags are site-wide pages filtered to the school, so the reader stays inside the section.
 * Scrolls sideways on phones rather than wrapping.
 */
export function SchoolNav({ school, navTags, active }: Props) {
  const q = `?school=${school.slug}`;
  const items = [
    { key: "latest", label: "Latest", href: schoolPath(school.slug) },
    { key: "podcasts", label: "Podcasts", href: `/podcasts${q}` },
    { key: "videos", label: "Videos", href: `/videos${q}` },
  ];
  const tags = (navTags ?? []).filter((t) => t.slug && t.name).slice(0, 6);

  const linkClass = (current: boolean) =>
    `relative flex h-12 shrink-0 items-center whitespace-nowrap font-ui text-[0.875rem] no-underline transition-colors ${
      current ? "font-semibold text-fg after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-accent" : "text-fg-muted hover:text-fg"
    }`;

  return (
    <nav aria-label={`${school.shortName ?? school.name ?? "Section"} sections`} className="border-b border-line">
      <div className="-mx-4 flex gap-6 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <Link key={item.key} href={item.href} aria-current={active === item.key ? "page" : undefined} className={linkClass(active === item.key)}>
            {item.label}
          </Link>
        ))}
        {tags.length > 0 && <span aria-hidden="true" className="my-auto h-4 w-px shrink-0 bg-line" />}
        {tags.map((t) => (
          <Link
            key={t._id}
            href={`${tagPath(t.slug!)}${q}`}
            aria-current={active === t.slug ? "page" : undefined}
            className={linkClass(active === t.slug)}
          >
            {t.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
