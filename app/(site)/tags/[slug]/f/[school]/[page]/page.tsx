import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { parseFilter } from "@/lib/sanity/paginate";
import { TagView, tagHref, tagMetadata } from "../../../../../_views/TagView";

// Target of the "/tags/{slug}?school=&page=" rewrites in next.config.ts. Canonical stays on the query form.
export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string; school: string; page: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, school, page } = await params;
  const f = parseFilter(school, page);
  return f ? tagMetadata(slug, f) : {};
}

export default async function TagFilterPage({ params }: Props) {
  const { slug, school, page } = await params;
  const f = parseFilter(school, page);
  if (!f) notFound();
  if (!f.school && f.page === 1) redirect(tagHref(slug, "", 1));
  return <TagView slug={slug} filter={f} />;
}
