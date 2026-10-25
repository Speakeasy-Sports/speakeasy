import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/sanity/loaders";
import { pageSeo } from "@/lib/page-seo";
import { buildMetadata, defaultOgImage, NATIONAL_SLUG } from "@/lib/seo";
import { NationalView } from "../_views/NationalView";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const seo = pageSeo(settings?.pageSeo, "national");
  return buildMetadata({
    title: seo.title ?? "National college sports",
    description: seo.description ?? "College football and college sports culture, on the field and beyond.",
    path: `/${NATIONAL_SLUG}`,
    fallbackImage: defaultOgImage(settings),
  });
}

export default function NationalPage() {
  return <NationalView page={1} />;
}
