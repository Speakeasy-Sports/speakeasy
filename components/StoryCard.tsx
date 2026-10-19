import Link from "next/link";
import type { ArticleCard } from "@/lib/types";
import { articlePath } from "@/lib/seo";
import { formatPublished } from "@/lib/format/date";
import { youtubeId, youtubeThumbnail } from "@/lib/embeds";
import { LabelRow } from "./Labels";
import { SanityImage } from "./SanityImage";

type Props = {
  article: ArticleCard;
  /** Image width in CSS px at the largest breakpoint. */
  imageWidth?: number;
  sizes?: string;
  priority?: boolean;
};

export function StoryCard({ article, imageWidth = 600, sizes = "(min-width: 768px) 33vw, 100vw", priority }: Props) {
  if (!article.slug || !article.school?.slug) return null;
  const href = articlePath(article.school.slug, article.slug);
  const ytId = article.heroType === "video" && article.heroEmbed?.url ? youtubeId(article.heroEmbed.url) : null;

  return (
    <article className="group flex flex-col gap-3" data-school={article.school.slug}>
      <Link href={href} className="block overflow-hidden rounded-base bg-bg-elev no-underline" style={{ aspectRatio: "16 / 9" }} tabIndex={-1} aria-hidden>
        {article.heroImage?.asset ? (
          <SanityImage
            image={article.heroImage}
            width={imageWidth}
            aspect={16 / 9}
            sizes={sizes}
            priority={priority}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : ytId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={youtubeThumbnail(ytId)} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-accent/10 font-ui text-sm text-accent">
            {article.heroType === "podcast" ? "Podcast" : ""}
          </span>
        )}
      </Link>
      <div>
        <LabelRow type={article.contentType} school={article.school} />
        <h3 className="mt-1 font-display text-xl font-semibold leading-snug">
          <Link href={href} className="no-underline group-hover:underline">
            {article.title}
          </Link>
        </h3>
        {article.dek && <p className="mt-1 text-base text-fg-muted">{article.dek}</p>}
        <p className="mt-2 font-ui text-sm text-fg-subtle">
          {article.authors?.map((a) => a.name).filter(Boolean).join(", ")}
          {article.publishedAt && (
            <>
              {article.authors?.length ? " · " : ""}
              <time dateTime={article.publishedAt}>{formatPublished(article.publishedAt)}</time>
            </>
          )}
        </p>
      </div>
    </article>
  );
}
