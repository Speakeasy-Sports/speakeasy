import type { Metadata } from "next";
import { TagView, tagMetadata } from "../../_views/TagView";

// Rendered on first request, then cached. "?school=" and "?page=" are rewritten in next.config.ts to ./f/[school]/[page].
export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return tagMetadata((await params).slug, { school: "", page: 1 });
}

export default async function TagPage({ params }: Props) {
  return <TagView slug={(await params).slug} filter={{ school: "", page: 1 }} />;
}
