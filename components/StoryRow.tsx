import Link from "next/link";
import type { ArticleCard } from "@/lib/types";
import { articlePath } from "@/lib/seo";
import { formatPublished } from "@/lib/format/date";
import { LabelRow } from "./Labels";

/** Compact list unit for "Latest": labels, headline, timestamp. */
export function StoryRow({ article }: { article: ArticleCard }) {
  if (!article.slug || !article.school?.slug) return null;
  const href = articlePath(article.school.slug, article.slug);

  return (
    <article className="py-4" data-school={article.school.slug}>
      <LabelRow type={article.contentType} school={article.school} />
      <h3 className="mt-1 font-display text-lg font-semibold leading-snug md:text-xl">
        <Link href={href} className="no-underline hover:underline">
          {article.title}
        </Link>
      </h3>
      {article.publishedAt && (
        <p className="mt-1 font-ui text-sm text-fg-subtle">
          <time dateTime={article.publishedAt}>{formatPublished(article.publishedAt)}</time>
        </p>
      )}
    </article>
  );
}
