import Link from "next/link";
import type { ArticleCard } from "@/lib/types";
import { storyPath } from "@/lib/seo";
import { LabelRow } from "./Labels";
import { hasPicture, StoryImage } from "./StoryImage";
import { TrackClicks } from "./TrackClicks";

type Props = { article: ArticleCard | null | undefined; heading: string };

/** The one story offered first at the end of an article, before any newsletter or community ask. */
export function ReadNext({ article, heading }: Props) {
  const href = article ? storyPath(article) : null;
  if (!article || !href) return null;
  const picture = hasPicture(article);

  return (
    <section aria-labelledby="read-next-h" className="measure mt-14 border-t border-fg pt-6">
      <h2 id="read-next-h" className="label-caps text-fg-muted">
        {heading}
      </h2>
      <TrackClicks event={{ name: "read_next_click" }}>
        <article
          data-school={article.school?.slug ?? undefined}
          className={`group mt-4 grid items-start gap-5 ${picture ? "sm:grid-cols-[1fr_11rem] sm:gap-8" : ""}`}
        >
          <div className="flex min-w-0 flex-col gap-2.5">
            <LabelRow type={article.contentType} scope={article.scope} school={article.school} />
            <h3 className="headline text-[1.625rem] leading-[1.1]">
              <Link href={href} className="story-link">
                {article.title}
              </Link>
            </h3>
            {article.dek && <p className="text-base leading-snug text-fg-muted">{article.dek}</p>}
          </div>
          {picture && (
            <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
              <StoryImage article={article} width={352} sizes="(min-width: 640px) 176px, 100vw" aspect="wide" />
            </Link>
          )}
        </article>
      </TrackClicks>
    </section>
  );
}
