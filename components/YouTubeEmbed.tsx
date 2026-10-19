"use client";

import { useState } from "react";
import { track } from "@/lib/analytics/plausible";
import { youtubeEmbedUrl, youtubeId, youtubeThumbnail } from "@/lib/embeds";
import { MediaFrame } from "./MediaFrame";

type Props = {
  url: string;
  title?: string | null;
  className?: string;
};

/**
 * Facade: renders the thumbnail and a play button, loads the iframe only on click.
 * Keeps YouTube's ~500KB of script out of the initial page. Fires video_play.
 */
export function YouTubeEmbed({ url, title, className = "" }: Props) {
  const [active, setActive] = useState(false);
  const id = youtubeId(url);
  const label = title || "Video";

  if (!id) {
    return (
      <p className="font-ui text-sm text-fg-muted">
        <a href={url} rel="noopener noreferrer" target="_blank">
          Watch on YouTube
        </a>
      </p>
    );
  }

  return (
    <MediaFrame kind="video" className={className}>
      {active ? (
        <iframe
          src={youtubeEmbedUrl(id)}
          title={label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setActive(true);
            track({ name: "video_play", props: { provider: "youtube" } });
          }}
          aria-label={`Play video: ${label}`}
          className="group absolute inset-0 flex h-full w-full items-center justify-center bg-black"
        >
          {/* Thumbnail from YouTube's image CDN; not run through next/image because it is third-party and lazy. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={youtubeThumbnail(id)}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
          />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </MediaFrame>
  );
}
