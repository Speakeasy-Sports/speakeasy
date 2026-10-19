import type { Metadata } from "next";
import { AuthorView, authorMetadata } from "../../_views/AuthorView";

// Rendered on first request, then cached. "?page=" is rewritten in next.config.ts to ./p/[page].
export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return authorMetadata((await params).slug, 1);
}

export default async function AuthorPage({ params }: Props) {
  return <AuthorView slug={(await params).slug} page={1} />;
}
