import type { Metadata } from "next";
import { client } from "@/lib/sanity/client";
import { SCHOOL_SLUGS_QUERY } from "@/lib/sanity/queries";
import { getSiteSettings } from "@/lib/sanity/loaders";
import { buildMetadata, defaultOgImage, schoolPath } from "@/lib/seo";
import { getSchoolFront, SchoolView } from "../_views/SchoolView";

// ISR: every school is prerendered at build and revalidated every 60s and on demand from the webhook.
export const revalidate = 60;
export const dynamicParams = true;

type Props = { params: Promise<{ school: string }> };

export async function generateStaticParams() {
  try {
    const rows = await client.fetch(SCHOOL_SLUGS_QUERY, {}, { useCdn: false });
    return rows.filter((r): r is { slug: string } => Boolean(r.slug)).map((r) => ({ school: r.slug }));
  } catch (err) {
    console.warn("generateStaticParams(school): could not list slugs", err);
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { school: slug } = await params;
  const [school, settings] = await Promise.all([getSchoolFront(slug), getSiteSettings()]);
  if (!school) return {};
  return buildMetadata({
    title: school.seoTitle ?? school.name ?? slug,
    description: school.seoDescription ?? school.description,
    path: schoolPath(slug),
    fallbackImage: defaultOgImage(settings),
    schoolFeed: { path: `/${slug}/feed.xml`, title: `${school.shortName ?? school.name} on Speakeasy Sports` },
  });
}

export default async function SchoolPage({ params }: Props) {
  const { school } = await params;
  return <SchoolView slug={school} page={1} />;
}
