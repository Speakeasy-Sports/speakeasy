import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { parsePage } from "@/lib/sanity/paginate";
import { getSiteSettings } from "@/lib/sanity/loaders";
import { resolveCopy } from "@/lib/site-copy";
import { buildMetadata, NATIONAL_SLUG } from "@/lib/seo";
import { NationalView } from "../../../_views/NationalView";

// Target of the "/national?page=N" rewrite in next.config.ts. See app/(site)/latest/[page]/page.tsx.
export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ page: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = parsePage((await params).page);
  if (!page) return {};
  const heading = resolveCopy((await getSiteSettings())?.copy).national.heading;
  return buildMetadata({ title: `${heading}: latest, page ${page}`, path: `/${NATIONAL_SLUG}?page=${page}` });
}

export default async function NationalLatestPage({ params }: Props) {
  const page = parsePage((await params).page);
  if (!page) notFound();
  if (page === 1) redirect(`/${NATIONAL_SLUG}`);
  return <NationalView page={page} />;
}
