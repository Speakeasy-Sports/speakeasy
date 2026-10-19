import type { Metadata } from "next";
import { MediaIndexView, mediaMetadata, type MediaSearch } from "../_views/MediaIndexView";

type Props = { searchParams: Promise<MediaSearch> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return mediaMetadata("video", await searchParams);
}

export default async function VideosPage({ searchParams }: Props) {
  return <MediaIndexView kind="video" searchParams={await searchParams} />;
}
