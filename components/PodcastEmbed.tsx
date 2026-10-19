"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics/plausible";
import { podcastEmbedHeight, podcastEmbedUrl } from "@/lib/embeds";
import { MediaFrame } from "./MediaFrame";

type Props = {
  provider: string;
  url: string;
  title?: string | null;
  /** Hero players load immediately; body players wait until they are near the viewport. */
  eager?: boolean;
  className?: string;
};

export function PodcastEmbed({ provider, url, title, eager = false, className = "" }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [visible, setVisible] = useState(eager);
  const [played, setPlayed] = useState(false);

  const src = podcastEmbedUrl(provider, url);
  const height = podcastEmbedHeight(provider);
  const label = title || "Podcast player";

  useEffect(() => {
    if (visible || !frameRef.current) return;
    const el = frameRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  // The iframe swallows clicks. When the window loses focus to our iframe, the reader interacted with the player.
  useEffect(() => {
    if (!visible || played) return;
    const onBlur = () => {
      if (document.activeElement === iframeRef.current) {
        setPlayed(true);
        track({ name: "podcast_play", props: { provider } });
      }
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [visible, played, provider]);

  if (!src) {
    return (
      <p className="font-ui text-sm text-fg-muted">
        <a href={url} rel="noopener noreferrer" target="_blank">
          Listen to this episode
        </a>
      </p>
    );
  }

  return (
    <div ref={frameRef}>
      <MediaFrame kind="podcast" height={height} className={className}>
        {visible && (
          <iframe
            ref={iframeRef}
            src={src}
            title={label}
            height={height}
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-popups-to-escape-sandbox allow-storage-access-by-user-activation"
            className="absolute inset-0 h-full w-full border-0"
          />
        )}
      </MediaFrame>
    </div>
  );
}
