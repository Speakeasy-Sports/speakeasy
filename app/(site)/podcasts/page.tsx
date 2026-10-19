import type { Metadata } from "next";
import { MediaIndexView, mediaMetadata } from "../_views/MediaIndexView";

// Static. "?school=" and "?page=" are rewritten in next.config.ts to ./f/[school]/[page].
export const revalidate = 60;

export function generateMetadata(): Promise<Metadata> {
  return mediaMetadata("podcast", { school: "", page: 1 });
}

export default function PodcastsPage() {
  return <MediaIndexView kind="podcast" filter={{ school: "", page: 1 }} />;
}
