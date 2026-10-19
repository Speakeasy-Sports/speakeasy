import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { parseFilter } from "@/lib/sanity/paginate";
import { MediaIndexView, mediaHref, mediaMetadata } from "../../../../_views/MediaIndexView";

// Target of the "/videos?school=&page=" rewrites in next.config.ts. Canonical stays on the query form.
export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ school: string; page: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { school, page } = await params;
  const f = parseFilter(school, page);
  return f ? mediaMetadata("video", f) : {};
}

export default async function VideosFilterPage({ params }: Props) {
  const { school, page } = await params;
  const f = parseFilter(school, page);
  if (!f) notFound();
  if (!f.school && f.page === 1) redirect(mediaHref("video", "", 1));
  return <MediaIndexView kind="video" filter={f} />;
}
