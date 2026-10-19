import type { Metadata } from "next";
import { sanityFetch } from "@/lib/sanity/fetch";
import { HOME_LATEST_QUERY } from "@/lib/sanity/queries";
import { getSiteSettings } from "@/lib/sanity/loaders";
import { tags } from "@/lib/sanity/tags";
import { buildMetadata, DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo";
import { StoryRow } from "@/components/StoryRow";
import { NewsletterSignup } from "@/components/NewsletterSignup";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    ...buildMetadata({
      title: settings?.tagline ? `${SITE_NAME}: ${settings.tagline}` : SITE_NAME,
      description: settings?.tagline ?? DEFAULT_DESCRIPTION,
      path: "/",
    }),
    title: { absolute: settings?.tagline ? `${SITE_NAME}: ${settings.tagline}` : SITE_NAME },
  };
}

// Week 1 front page: the Latest list. Lead story, secondary row, and pagination land in week 2 (AGENTS.md section 12).
export default async function HomePage() {
  const [latest, settings] = await Promise.all([
    sanityFetch({ query: HOME_LATEST_QUERY, tags: [tags.home, tags.articles] }),
    getSiteSettings(),
  ]);

  return (
    <div className="py-8">
      <section aria-labelledby="latest-h">
        <h1 id="latest-h" className="label-caps border-b border-line pb-3 text-fg-muted">
          Latest
        </h1>
        {latest.length === 0 ? (
          <p className="py-10 text-fg-muted">No stories yet. Publish an article in the Studio and it appears here within a minute.</p>
        ) : (
          <div className="divide-y divide-line">
            {latest.map((a) => (
              <StoryRow key={a._id} article={a} />
            ))}
          </div>
        )}
      </section>

      <div className="mt-12 max-w-2xl">
        <NewsletterSignup headline={settings?.newsletterHeadline} blurb={settings?.newsletterBlurb} location="home" />
      </div>
    </div>
  );
}
