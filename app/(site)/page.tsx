import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/sanity/loaders";
import { buildMetadata, DEFAULT_DESCRIPTION, defaultOgImage, SITE_NAME } from "@/lib/seo";
import { pageSeo } from "@/lib/page-seo";
import { HomeView } from "./_views/HomeView";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const seo = pageSeo(settings?.pageSeo, "home");
  return buildMetadata({
    title: seo.title ?? (settings?.tagline ? `${SITE_NAME}: ${settings.tagline}` : SITE_NAME),
    description: seo.description ?? settings?.tagline ?? DEFAULT_DESCRIPTION,
    path: "/",
    absoluteTitle: true,
    fallbackImage: defaultOgImage(settings),
  });
}

export default function HomePage() {
  return <HomeView page={1} />;
}
