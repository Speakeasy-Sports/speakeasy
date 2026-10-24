// Plausible custom events (AGENTS.md 7.5). Safe to call from client components only.

export type PlausibleEvent =
  | { name: "join_click"; props: { location: "article_end" | "school_header" | "rail" | "community_page" } }
  | { name: "newsletter_signup"; props?: { location?: string } }
  | { name: "discuss_click"; props?: { school?: string } }
  | { name: "video_play"; props?: { provider?: string } }
  | { name: "podcast_play"; props?: { provider?: string } };

type PlausibleFn = (event: string, options?: { props?: Record<string, string | number | boolean | undefined> }) => void;

declare global {
  interface Window {
    plausible?: PlausibleFn & { q?: unknown[] };
  }
}

export function track(event: PlausibleEvent): void {
  if (typeof window === "undefined") return;
  const fn = window.plausible;
  if (!fn) return;
  fn(event.name, event.props ? { props: event.props } : undefined);
}

export const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
