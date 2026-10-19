import Link from "next/link";
import type { ArticleCard } from "@/lib/types";
import { articlePath } from "@/lib/seo";
import { LabelRow } from "./Labels";
import { StoryImage } from "./StoryImage";
import { StoryMeta } from "./StoryMeta";

type Props = { article: ArticleCard; showSchool?: boolean };

/** The front-page lead: photo on the left two thirds, headline set large beside it; stacked on phones. */
export function LeadStory({ article, showSchool = true }: Props) {
  if (!article.slug || !article.school?.slug) return null;
  const href = articlePath(article.school.slug, article.slug);

  return (
    <article data-school={article.school.slug} className="group grid gap-5 lg:grid-cols-12 lg:items-center lg:gap-10">
      <Link href={href} tabIndex={-1} aria-hidden="true" className="block lg:col-span-7">
        <StoryImage
          article={article}
          width={1200}
          sizes="(min-width: 1216px) 680px, (min-width: 1024px) 56vw, 100vw"
          priority
          badge
          artSize="lg"
        />
      </Link>
      <div className="flex flex-col gap-4 lg:col-span-5">
        <LabelRow type={article.contentType} school={article.school} showSchool={showSchool} />
        <h2 className="headline text-[2rem] leading-[1.06] sm:text-[2.5rem] lg:text-[2.875rem] lg:tracking-[-0.022em]">
          <Link href={href} className="story-link">
            {article.title}
          </Link>
        </h2>
        {article.dek && <p className="text-lg leading-snug text-fg-muted lg:text-xl">{article.dek}</p>}
        <StoryMeta article={article} withPhoto className="mt-1" />
      </div>
    </article>
  );
}
