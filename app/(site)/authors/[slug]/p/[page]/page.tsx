import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { parsePage } from "@/lib/sanity/paginate";
import { AuthorView, authorMetadata, authorPageHref } from "../../../../_views/AuthorView";

// Target of the "/authors/{slug}?page=N" rewrite in next.config.ts. Canonical stays on the query form.
export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string; page: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, page: raw } = await params;
  const page = parsePage(raw);
  return page ? authorMetadata(slug, page) : {};
}

export default async function AuthorPagedPage({ params }: Props) {
  const { slug, page: raw } = await params;
  const page = parsePage(raw);
  if (!page) notFound();
  if (page === 1) redirect(authorPageHref(slug, 1));
  return <AuthorView slug={slug} page={page} />;
}
