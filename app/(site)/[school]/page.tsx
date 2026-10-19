import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { stegaClean } from "@sanity/client/stega";
import { sanityFetch } from "@/lib/sanity/fetch";
import { client } from "@/lib/sanity/client";
import { SCHOOL_LATEST_QUERY, SCHOOL_QUERY, SCHOOL_SLUGS_QUERY } from "@/lib/sanity/queries";
import { getSiteSettings } from "@/lib/sanity/loaders";
import { schoolPageTags } from "@/lib/sanity/tags";
import { isReservedSlug } from "@/lib/reserved-slugs";
import { joinUrlFor } from "@/lib/circle-links";
import { buildMetadata, schoolPath } from "@/lib/seo";
import { JoinButton } from "@/components/JoinButton";
import { SchoolTheme } from "@/components/SchoolTheme";
import { StoryRow } from "@/components/StoryRow";
import { NewsletterSignup } from "@/components/NewsletterSignup";

// ISR, see the article page for the pattern.
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

async function getSchool(slug: string) {
  if (isReservedSlug(slug) || !/^[a-z0-9-]+$/.test(slug)) return null;
  return sanityFetch({ query: SCHOOL_QUERY, params: { slug }, tags: schoolPageTags(slug) });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { school: slug } = await params;
  const school = await getSchool(slug);
  if (!school) return {};
  return buildMetadata({
    title: school.seoTitle ?? `${school.name} ${school.mascot ? school.mascot : ""}`.trim(),
    description: school.seoDescription ?? school.description,
    path: schoolPath(slug),
  });
}

// Week 1 school section: header, join CTA, Latest. Sub-nav and tag filters land in week 2.
export default async function SchoolPage({ params }: Props) {
  const { school: slug } = await params;
  const school = await getSchool(slug);
  if (!school) notFound();

  const [latest, settings] = await Promise.all([
    sanityFetch({
      query: SCHOOL_LATEST_QUERY,
      params: { schoolId: school._id },
      tags: schoolPageTags(slug),
    }),
    getSiteSettings(),
  ]);
  const joinUrl = joinUrlFor(school, settings);
  const schoolSlug = stegaClean(school.slug) ?? slug;

  return (
    <div data-school={schoolSlug} className="py-8">
      <SchoolTheme slug={schoolSlug} accentColor={school.accentColor} accentColorDark={school.accentColorDark} />

      <header className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-accent pb-6">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">{school.name}</h1>
          {school.communityName && <p className="mt-1 font-ui text-fg-muted">{school.communityName}</p>}
        </div>
        <JoinButton href={joinUrl} location="school_header">
          Join {school.communityName ?? "the Club"}
        </JoinButton>
      </header>

      <section aria-labelledby="school-latest-h" className="mt-6">
        <h2 id="school-latest-h" className="label-caps border-b border-line pb-3 text-fg-muted">
          Latest
        </h2>
        {latest.length === 0 ? (
          <p className="py-10 text-fg-muted">No stories yet.</p>
        ) : (
          <div className="divide-y divide-line">
            {latest.map((a) => (
              <StoryRow key={a._id} article={a} />
            ))}
          </div>
        )}
      </section>

      <div className="mt-12 max-w-2xl">
        <NewsletterSignup
          headline={settings?.newsletterHeadline}
          blurb={settings?.newsletterBlurb}
          school={schoolSlug}
          location="school"
        />
      </div>
    </div>
  );
}
