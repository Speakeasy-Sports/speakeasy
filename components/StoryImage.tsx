import type { ArticleCard } from "@/lib/types";
import { youtubeId, youtubeThumbnail } from "@/lib/embeds";
import { SanityImage } from "./SanityImage";
import { MediaArt } from "./MediaArt";

type Props = {
  article: Pick<ArticleCard, "title" | "heroType" | "heroImage" | "heroEmbed" | "school" | "contentType">;
  /** Width of the request in CSS px at the largest breakpoint. Heroes 1200, cards 600, thumbs 240. */
  width: number;
  sizes: string;
  aspect?: "wide" | "square" | "tall";
  priority?: boolean;
  /** Show a Listen or Watch badge on media stories. */
  badge?: boolean;
  artSize?: "sm" | "md" | "lg";
};

/**
 * Whether a story has something real to show: a hero photo, or a podcast or video lead (which get their artwork).
 * Written stories without a photo are text-only and render no picture frame at all (docs/specs/phase-1-ux-update.md,
 * 4.2): no placeholder, no generated art.
 */
export function hasPicture(article: Pick<ArticleCard, "heroType" | "heroImage">): boolean {
  return Boolean(article.heroImage?.asset) || article.heroType === "video" || article.heroType === "podcast";
}

const RATIOS = { wide: 16 / 9, square: 1, tall: 4 / 5 } as const;
const ASPECT_CSS = { wide: "16 / 9", square: "1 / 1", tall: "4 / 5" } as const;

/**
 * The picture for a story in any list: its hero photo, else a YouTube frame for video leads, else MediaArt.
 * Fixed aspect box so nothing shifts while images load. Images are decorative here (the headline is the link text),
 * so the frame is hidden from assistive tech and the image alt is empty.
 */
export function StoryImage({ article, width, sizes, aspect = "wide", priority, badge, artSize }: Props) {
  const isMedia = article.heroType === "video" || article.heroType === "podcast";
  const ytId = article.heroType === "video" && article.heroEmbed?.url ? youtubeId(article.heroEmbed.url) : null;

  let picture: React.ReactNode;
  if (article.heroImage?.asset) {
    picture = (
      <SanityImage
        image={article.heroImage}
        alt=""
        decorative
        width={width}
        aspect={RATIOS[aspect]}
        sizes={sizes}
        priority={priority}
        className="photo-zoom h-full w-full object-cover"
      />
    );
  } else if (ytId) {
    picture = (
      // YouTube's own frame; next/image would proxy a third-party image for no gain.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={youtubeThumbnail(ytId)}
        alt=""
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="photo-zoom h-full w-full object-cover"
      />
    );
  } else {
    picture = (
      <MediaArt
        kind={article.heroType === "video" ? "video" : article.heroType === "podcast" ? "podcast" : "story"}
        seed={article.title ?? ""}
        label={article.heroType === "podcast" ? article.school?.shortName : null}
        size={artSize}
      />
    );
  }

  return (
    <div aria-hidden="true" className="relative overflow-hidden bg-bg-elev" style={{ aspectRatio: ASPECT_CSS[aspect] }}>
      {picture}
      {badge && isMedia && (
        <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-bg/90 px-2.5 py-1 font-ui text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-fg backdrop-blur-sm">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            {article.heroType === "podcast" ? (
              <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm-7 9a7 7 0 0 0 6 6.93V21h2v-2.07A7 7 0 0 0 19 12h-2a5 5 0 0 1-10 0H5Z" />
            ) : (
              <path d="M7 4.5v15L19.5 12z" />
            )}
          </svg>
          {article.heroType === "podcast" ? "Listen" : "Watch"}
        </span>
      )}
    </div>
  );
}
