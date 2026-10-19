import Link from "next/link";
import { contentTypeLabel } from "@/lib/content-types";
import { schoolPath } from "@/lib/seo";

export function TypeLabel({ type, className = "" }: { type: string | null | undefined; className?: string }) {
  const label = contentTypeLabel(type);
  if (!label) return null;
  return <span className={`label-caps text-accent ${className}`}>{label}</span>;
}

export function SchoolLabel({
  slug,
  name,
  className = "",
}: {
  slug: string | null | undefined;
  name: string | null | undefined;
  className?: string;
}) {
  if (!slug || !name) return null;
  return (
    <Link href={schoolPath(slug)} className={`label-caps text-accent no-underline hover:underline ${className}`}>
      {name}
    </Link>
  );
}

/** "Type · School" pair used at the top of cards and articles. Inside a school's own section the school is implied. */
export function LabelRow({
  type,
  school,
  showSchool = true,
  className = "",
}: {
  type: string | null | undefined;
  school: { slug: string | null; shortName?: string | null; name?: string | null } | null | undefined;
  showSchool?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 ${className}`}>
      <TypeLabel type={type} />
      {showSchool && school?.slug && (
        <>
          <span aria-hidden className="text-fg-subtle">
            &middot;
          </span>
          <SchoolLabel slug={school.slug} name={school.shortName ?? school.name} />
        </>
      )}
    </div>
  );
}
