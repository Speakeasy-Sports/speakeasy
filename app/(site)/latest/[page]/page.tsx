import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { parsePage } from "@/lib/sanity/paginate";
import { buildMetadata } from "@/lib/seo";
import { HomeView } from "../../_views/HomeView";

// Target of the "/?page=N" rewrite in next.config.ts. Kept separate from "/" so the front page stays fully static.
// Rendered on first request, then cached like every other page.
export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ page: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = parsePage((await params).page);
  if (!page) return {};
  return buildMetadata({ title: `Latest stories, page ${page}`, path: `/?page=${page}` });
}

export default async function LatestPage({ params }: Props) {
  const page = parsePage((await params).page);
  if (!page) notFound();
  if (page === 1) redirect("/");
  return <HomeView page={page} />;
}
