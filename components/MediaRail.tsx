import Link from "next/link";
import type { ArticleCard } from "@/lib/types";
import { CompactRow } from "./StoryRow";

type Props = { items: ArticleCard[]; heading: string; schoolSlug?: string | null; showSchool?: boolean };

/** "Listen and watch" by default: the latest podcasts and videos, beside the Latest list. */
export function MediaRail({ items, heading, schoolSlug, showSchool = true }: Props) {
  if (items.length === 0) return null;
  const q = schoolSlug ? `?school=${schoolSlug}` : "";
  return (
    <section aria-labelledby="media-rail-h">
      <h2 id="media-rail-h" className="rule-heading">
        {heading}
      </h2>
      <div className="divide-y divide-line">
        {items.map((a) => (
          <CompactRow key={a._id} article={a} showSchool={showSchool} />
        ))}
      </div>
      <p className="flex gap-5 border-t border-line pt-4 font-ui text-sm">
        <Link href={`/podcasts${q}`} className="font-medium text-fg underline decoration-line underline-offset-4 hover:decoration-fg">
          All podcasts
        </Link>
        <Link href={`/videos${q}`} className="font-medium text-fg underline decoration-line underline-offset-4 hover:decoration-fg">
          All videos
        </Link>
      </p>
    </section>
  );
}
