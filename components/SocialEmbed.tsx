"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  provider: string;
  url: string;
};

const SCRIPTS: Record<string, string> = {
  x: "https://platform.twitter.com/widgets.js",
  instagram: "https://www.instagram.com/embed.js",
  tiktok: "https://www.tiktok.com/embed.js",
};

const LABELS: Record<string, string> = {
  x: "View post on X",
  instagram: "View post on Instagram",
  tiktok: "View on TikTok",
};

declare global {
  interface Window {
    twttr?: { widgets?: { load: (el?: Element) => void } };
    instgrm?: { Embeds?: { process: () => void } };
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => {
      s.dataset.loaded = "true";
      resolve();
    };
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(s);
  });
}

/**
 * X, Instagram, and TikTok through their official embed scripts, loaded only when the block scrolls near the viewport.
 * The plain link renders first and stays as the fallback.
 */
export function SocialEmbed({ provider, url }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [failed, setFailed] = useState(false);
  const label = LABELS[provider] ?? "View post";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    const src = SCRIPTS[provider];
    if (!src) return;
    loadScript(src)
      .then(() => {
        if (provider === "x") window.twttr?.widgets?.load(ref.current ?? undefined);
        if (provider === "instagram") window.instgrm?.Embeds?.process();
      })
      .catch(() => setFailed(true));
  }, [near, provider]);

  const fallback = (
    <p className="font-ui text-sm">
      <a href={url} rel="noopener noreferrer" target="_blank">
        {label}
      </a>
    </p>
  );

  return (
    <div ref={ref} className="my-8 flex justify-center" data-social-embed={provider}>
      {failed || !near ? (
        fallback
      ) : provider === "x" ? (
        <blockquote className="twitter-tweet" data-dnt="true">
          {fallback}
        </blockquote>
      ) : provider === "instagram" ? (
        <blockquote className="instagram-media" data-instgrm-permalink={url} data-instgrm-version="14">
          {fallback}
        </blockquote>
      ) : provider === "tiktok" ? (
        <blockquote className="tiktok-embed" cite={url} data-video-id={tiktokVideoId(url) ?? undefined}>
          <section>{fallback}</section>
        </blockquote>
      ) : (
        fallback
      )}
    </div>
  );
}

function tiktokVideoId(url: string): string | null {
  const m = url.match(/\/video\/(\d+)/);
  return m?.[1] ?? null;
}
