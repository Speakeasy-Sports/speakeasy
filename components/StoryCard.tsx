import Link from "next/link";
import type { ArticleCard } from "@/lib/types";
import { storyPath } from "@/lib/seo";
import { LabelRow } from "./Labels";
import { hasPicture, StoryImage } from "./StoryImage";
import { StoryMeta } from "./StoryMeta";

type Props = {
  article: ArticleCard;
  /** Image width in CSS px at the largest breakpoint. */
  imageWidth?: number;
  sizes?: string;
  priority?: boolean;
  showSchool?: boolean;
  /** False on the national front, where "National" on every card would be noise. */
  showNational?: boolean;
  showDek?: boolean;
  /** Phones show secondary stories as thumbnail rows so the lead stays the only big picture. */
  compactOnPhone?: boolean;
  /** Date only, for while every story is by the same person. */
  hideAuthors?: boolean;
};

export function StoryCard({
  article,
  imageWidth = 600,
  sizes = "(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw",
  priority,
  showSchool = true,
  showNational = true,
  showDek = true,
  compactOnPhone = false,
  hideAuthors,
}: Props) {
  const href = storyPath(article);
  if (!href) return null;
  const labels = <LabelRow type={article.contentType} scope={article.scope} school={article.school} showSchool={showSchool} showNational={showNational} />;

  // Text only: a heavy rule in the section color instead of a picture, so the card reads as finished, not missing.
  if (!hasPicture(article)) {
    return (
      <article
        data-school={article.school?.slug ?? undefined}
        className={`group flex flex-col gap-2.5 border-t-[3px] pt-4 ${article.scope === "national" ? "border-fg" : "border-accent"}`}
      >
        {labels}
        <h3 className="headline text-[1.375rem] leading-[1.15] sm:text-[1.5rem]">
          <Link href={href} className="story-link">
            {article.title}
          </Link>
        </h3>
        {showDek && article.dek && <p className="text-base leading-snug text-fg-muted">{article.dek}</p>}
        <StoryMeta article={article} hideAuthors={hideAuthors} className="mt-1" />
      </article>
    );
  }

  return (
    <article
      data-school={article.school?.slug ?? undefined}
      className={`group ${compactOnPhone ? "grid grid-cols-[1fr_7rem] gap-4 sm:flex sm:flex-col" : "flex flex-col"} sm:gap-4`}
    >
      <Link href={href} tabIndex={-1} aria-hidden="true" className={`block ${compactOnPhone ? "order-2 sm:order-none" : ""}`}>
        <StoryImage article={article} width={imageWidth} sizes={sizes} priority={priority} badge={!compactOnPhone} aspect="wide" />
      </Link>
      <div className="flex min-w-0 flex-col gap-2.5">
        {labels}
        <h3 className="headline text-[1.1875rem] leading-[1.2] sm:text-[1.375rem]">
          <Link href={href} className="story-link">
            {article.title}
          </Link>
        </h3>
        {showDek && article.dek && (
          <p className={`text-base leading-snug text-fg-muted ${compactOnPhone ? "hidden sm:block" : ""}`}>{article.dek}</p>
        )}
        <StoryMeta article={article} hideAuthors={hideAuthors} className="mt-1" />
      </div>
    </article>
  );
}
