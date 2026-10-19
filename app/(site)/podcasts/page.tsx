import type { Metadata } from "next";
import { MediaIndexView, mediaMetadata, type MediaSearch } from "../_views/MediaIndexView";

type Props = { searchParams: Promise<MediaSearch> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return mediaMetadata("podcast", await searchParams);
}

export default async function PodcastsPage({ searchParams }: Props) {
  return <MediaIndexView kind="podcast" searchParams={await searchParams} />;
}
