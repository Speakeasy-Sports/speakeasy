// Turns public media URLs into embeddable players. Pure functions, unit tested.

export type EmbedProvider = "youtube" | "spotify" | "apple" | "other";

export function youtubeId(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, "");
  const isId = (s: string | null | undefined): s is string => !!s && /^[A-Za-z0-9_-]{11}$/.test(s);

  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return isId(id) ? id : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = u.searchParams.get("v");
    if (isId(v)) return v;
    const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/);
    if (m && isId(m[1])) return m[1];
  }
  return null;
}

export function youtubeEmbedUrl(id: string): string {
  const params = new URLSearchParams({ autoplay: "1", rel: "0", modestbranding: "1", playsinline: "1" });
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}

export function youtubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/**
 * Spotify: open.spotify.com/{type}/{id} -> open.spotify.com/embed/{type}/{id}
 * Apple: podcasts.apple.com/... -> embed.podcasts.apple.com/...
 * Other: used as-is if https, on the assumption it is already an embeddable player URL.
 */
export function podcastEmbedUrl(provider: EmbedProvider | string, url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;

  if (provider === "spotify") {
    if (!/(^|\.)spotify\.com$/.test(u.hostname)) return null;
    const m = u.pathname.match(/^\/(?:intl-[a-z]{2}\/)?(?:embed\/)?(episode|show|track|album|playlist)\/([A-Za-z0-9]+)/);
    if (!m) return null;
    return `https://open.spotify.com/embed/${m[1]}/${m[2]}?theme=0`;
  }
  if (provider === "apple") {
    if (!/(^|\.)podcasts\.apple\.com$/.test(u.hostname)) return null;
    u.hostname = "embed.podcasts.apple.com";
    return u.toString();
  }
  return u.toString();
}

/** Player heights in CSS pixels. Spotify's compact player is 152px; Apple's episode player is 175px. */
export function podcastEmbedHeight(provider: EmbedProvider | string): number {
  if (provider === "apple") return 175;
  return 152;
}
