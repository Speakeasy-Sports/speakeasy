import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { parsePage } from "@/lib/sanity/paginate";
import { buildMetadata, schoolPath } from "@/lib/seo";
import { getSchoolFront, SchoolView } from "../../../_views/SchoolView";

// Target of the "/{school}?page=N" rewrite in next.config.ts. See app/(site)/latest/[page]/page.tsx.
export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ school: string; page: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { school: slug, page: raw } = await params;
  const page = parsePage(raw);
  const school = page ? await getSchoolFront(slug) : null;
  if (!page || !school) return {};
  return buildMetadata({
    title: `${school.name}: latest, page ${page}`,
    path: `${schoolPath(slug)}?page=${page}`,
    schoolFeed: { path: `/${slug}/feed.xml`, title: `${school.shortName ?? school.name} on Speakeasy Sports` },
  });
}

export default async function SchoolLatestPage({ params }: Props) {
  const { school, page: raw } = await params;
  const page = parsePage(raw);
  if (!page) notFound();
  if (page === 1) redirect(schoolPath(school));
  return <SchoolView slug={school} page={page} />;
}
