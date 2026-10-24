import Link from "next/link";
import type { ArticleCard } from "@/lib/types";
import { storyPath } from "@/lib/seo";
import { LabelRow } from "./Labels";
import { hasPicture, StoryImage } from "./StoryImage";
import { StoryMeta } from "./StoryMeta";

type Props = { article: ArticleCard; showSchool?: boolean; showNational?: boolean; hideAuthors?: boolean };

/** River unit for Latest and archive lists: labels, headline, dek, meta, with a small photo on the right. */
export function StoryRow({ article, showSchool = true, showNational = true, hideAuthors }: Props) {
  const href = storyPath(article);
  if (!href) return null;
  const picture = hasPicture(article);

  return (
    <article
      data-school={article.school?.slug ?? undefined}
      className={
        picture
          ? "group grid grid-cols-[1fr_6.5rem] items-start gap-4 py-6 sm:grid-cols-[1fr_11rem] sm:gap-8"
          : // Text only: the row runs full width, with no empty thumbnail column.
            "group py-6"
      }
    >
      <div className="flex min-w-0 flex-col gap-2">
        <LabelRow type={article.contentType} scope={article.scope} school={article.school} showSchool={showSchool} showNational={showNational} />
        <h3 className="headline text-[1.1875rem] leading-[1.2] sm:text-[1.4375rem]">
          <Link href={href} className="story-link">
            {article.title}
          </Link>
        </h3>
        {article.dek && <p className={`text-base leading-snug text-fg-muted ${picture ? "hidden sm:block" : ""}`}>{article.dek}</p>}
        <StoryMeta article={article} hideAuthors={hideAuthors} className="mt-1" />
      </div>
      {picture && (
        <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
          <StoryImage article={article} width={360} sizes="(min-width: 640px) 176px, 104px" aspect="wide" artSize="sm" />
        </Link>
      )}
    </article>
  );
}

/** Rail unit: small square picture, kicker, headline. */
export function CompactRow({
  article,
  showSchool = true,
  showNational = true,
}: {
  article: ArticleCard;
  showSchool?: boolean;
  showNational?: boolean;
}) {
  const href = storyPath(article);
  if (!href) return null;
  return (
    <article data-school={article.school?.slug ?? undefined} className="group grid grid-cols-[4.5rem_1fr] items-center gap-4 py-4">
      <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
        <StoryImage article={article} width={160} sizes="72px" aspect="square" artSize="sm" />
      </Link>
      <div className="flex min-w-0 flex-col gap-1.5">
        <LabelRow type={article.contentType} scope={article.scope} school={article.school} showSchool={showSchool} showNational={showNational} />
        <h3 className="headline text-base leading-[1.25]">
          <Link href={href} className="story-link">
            {article.title}
          </Link>
        </h3>
      </div>
    </article>
  );
}
