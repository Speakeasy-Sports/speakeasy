import Link from "next/link";
import { contentTypeLabel } from "@/lib/content-types";
import { NATIONAL_SLUG, schoolPath } from "@/lib/seo";

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

/** "Section · Type" labels for national stories: neutral brand color, linking to /national. */
export function NationalLabel({ className = "" }: { className?: string }) {
  return (
    <Link href={`/${NATIONAL_SLUG}`} className={`label-caps text-fg no-underline hover:underline ${className}`}>
      National
    </Link>
  );
}

/**
 * "Type · School" pair used at the top of cards and articles. Inside a school's own section the school is implied;
 * on the national front, "National" is. A national story shown on a school front still says National.
 */
export function LabelRow({
  type,
  scope,
  school,
  showSchool = true,
  showNational = true,
  className = "",
}: {
  type: string | null | undefined;
  scope?: string | null;
  school: { slug: string | null; shortName?: string | null; name?: string | null } | null | undefined;
  showSchool?: boolean;
  showNational?: boolean;
  className?: string;
}) {
  const national = scope === "national";
  const section = national ? showNational && <NationalLabel /> : showSchool && school?.slug && <SchoolLabel slug={school.slug} name={school.shortName ?? school.name} />;
  return (
    <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 ${className}`}>
      <TypeLabel type={type} />
      {section && (
        <>
          <span aria-hidden className="text-fg-subtle">
            &middot;
          </span>
          {section}
        </>
      )}
    </div>
  );
}
