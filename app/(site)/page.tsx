import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/sanity/loaders";
import { buildMetadata, DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo";
import { HomeView } from "./_views/HomeView";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildMetadata({
    title: settings?.tagline ? `${SITE_NAME}: ${settings.tagline}` : SITE_NAME,
    description: settings?.tagline ?? DEFAULT_DESCRIPTION,
    path: "/",
    absoluteTitle: true,
  });
}

export default function HomePage() {
  return <HomeView page={1} />;
}
