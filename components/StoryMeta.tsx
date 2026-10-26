import { formatPublished } from "@/lib/format/date";
import type { ArticleCard } from "@/lib/types";
import { AuthorAvatar } from "./AuthorAvatar";

type Props = {
  article: Pick<ArticleCard, "authors" | "publishedAt">;
  /** Show the first author's photo. Used on lead stories only; dropped with the names. */
  withPhoto?: boolean;
  /** Omit author names, for lists where every story is by the same person. */
  hideAuthors?: boolean;
  className?: string;
};

/** "Jon Smith · 2 hours ago". Names are plain text here; the article page links them. */
export function StoryMeta({ article, withPhoto, hideAuthors, className = "" }: Props) {
  const authors = (article.authors ?? []).filter((a) => a.name);
  const names = authors.map((a) => a.name).join(", ");
  const first = authors[0];

  return (
    <p className={`flex items-center gap-2.5 font-ui text-[0.8125rem] leading-[1.2] tabular-nums text-fg-subtle ${className}`}>
      {withPhoto && !hideAuthors && first?.name && <AuthorAvatar name={first.name} photo={first.photo} size={28} />}
      {!hideAuthors && names && <span className="font-medium text-fg">{names}</span>}
      {!hideAuthors && names && article.publishedAt && <span aria-hidden="true">&middot;</span>}
      {article.publishedAt && <time dateTime={article.publishedAt}>{formatPublished(article.publishedAt)}</time>}
    </p>
  );
}
