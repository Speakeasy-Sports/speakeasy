import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { stegaClean } from "@sanity/client/stega";
import { sanityFetch } from "@/lib/sanity/fetch";
import { client } from "@/lib/sanity/client";
import { ARTICLE_QUERY, ARTICLE_SLUGS_QUERY } from "@/lib/sanity/queries";
import { getSiteSettings } from "@/lib/sanity/loaders";
import { articlePageTags } from "@/lib/sanity/tags";
import { urlFor } from "@/lib/sanity/image";
import { isReservedSlug } from "@/lib/reserved-slugs";
import { joinUrlFor } from "@/lib/circle-links";
import { contentTypeLabel } from "@/lib/content-types";
import { absoluteUrl, articlePath, authorPath, breadcrumbJsonLd, buildMetadata, newsArticleJsonLd, ogImageUrl, schoolPath } from "@/lib/seo";
import { LabelRow } from "@/components/Labels";
import { Byline } from "@/components/Byline";
import { HeroImage } from "@/components/HeroImage";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { PodcastEmbed } from "@/components/PodcastEmbed";
import { EpisodeNotes } from "@/components/EpisodeNotes";
import { SponsorSlot } from "@/components/SponsorSlot";
import { PortableTextRenderer } from "@/components/PortableTextRenderer";
import { CorrectionNote } from "@/components/CorrectionNote";
import { DiscussInClub } from "@/components/DiscussInClub";
import { AuthorCard } from "@/components/AuthorCard";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { RelatedStories } from "@/components/RelatedStories";
import { SchoolTheme } from "@/components/SchoolTheme";
import { JsonLd } from "@/components/JsonLd";

// ISR: the newest articles are prerendered at build, the rest on first request, all revalidated every 60s
// and on demand from the webhook. generateStaticParams is what makes Next treat the route as static.
export const revalidate = 60;
export const dynamicParams = true;

type Props = { params: Promise<{ school: string; slug: string }> };

const SLUG_RE = /^[a-z0-9-]+$/;

export async function generateStaticParams() {
  try {
    const rows = await client.fetch(ARTICLE_SLUGS_QUERY, {}, { useCdn: false });
    return rows
      .filter((r): r is { slug: string; school: string } => Boolean(r.slug && r.school))
      .map((r) => ({ school: r.school, slug: r.slug }));
  } catch (err) {
    // A Sanity outage at build time should not fail the deploy; pages render on first request instead.
    console.warn("generateStaticParams(article): could not list slugs", err);
    return [];
  }
}

async function getArticle(slug: string, school: string, stega = true) {
  if (!SLUG_RE.test(slug)) return null;
  return sanityFetch({
    query: ARTICLE_QUERY,
    params: { slug },
    tags: articlePageTags(slug, school),
    stega,
  });
}

/**
 * Canonical is /{primarySchool}/{slug}. A request at another listed school's path 301s there (AGENTS.md section 6).
 * Returns the article when the path is canonical, otherwise redirects or 404s.
 */
function resolveCanonical<T extends { school: { slug: string | null } | null; schools: Array<{ slug: string | null }> | null; slug: string | null }>(
  article: T | null,
  requestedSchool: string,
): T {
  if (!article?.school?.slug || !article.slug) notFound();
  const canonicalSchool = stegaClean(article.school.slug);
  if (canonicalSchool === requestedSchool) return article;
  const listed = (article.schools ?? []).some((s) => stegaClean(s.slug) === requestedSchool);
  if (listed) permanentRedirect(articlePath(canonicalSchool, stegaClean(article.slug)));
  notFound();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { school, slug } = await params;
  if (isReservedSlug(school)) return {};
  const article = await getArticle(slug, school, false);
  if (!article?.school?.slug || article.school.slug !== school) return {};

  const image = article.ogImageOverride?.asset
    ? { url: urlFor(article.ogImageOverride).width(1200).height(630).fit("crop").url(), width: 1200, height: 630 }
    : { url: ogImageUrl(article.slug ?? slug), width: 1200, height: 630 };

  return buildMetadata({
    title: article.seoTitle ?? article.title ?? "",
    description: article.seoDescription ?? article.dek,
    path: articlePath(article.school.slug, article.slug ?? slug),
    image,
    type: "article",
    noIndex: article.noIndex,
    article: {
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt ?? article.publishedAt,
      authors: (article.authors ?? []).map((a) => a.name).filter((n): n is string => Boolean(n)),
      section: article.school.shortName ?? article.school.name,
      tags: (article.tags ?? []).map((t) => t.name).filter((n): n is string => Boolean(n)),
    },
  });
}

export default async function ArticlePage({ params }: Props) {
  const { school: requestedSchool, slug } = await params;
  if (isReservedSlug(requestedSchool)) notFound();

  const [fetched, settings] = await Promise.all([getArticle(slug, requestedSchool), getSiteSettings()]);
  const article = resolveCanonical(fetched, requestedSchool);
  const school = article.school!;
  const schoolSlug = stegaClean(school.slug) ?? requestedSchool;
  const heroType = stegaClean(article.heroType);
  const canonical = articlePath(schoolSlug, stegaClean(article.slug) ?? slug);
  const joinUrl = joinUrlFor(school, settings);
  const authors = (article.authors ?? []).filter((a) => a.name);

  const heroImageUrl = article.heroImage?.asset ? urlFor(article.heroImage).width(1200).height(675).fit("crop").url() : null;

  const jsonLd = newsArticleJsonLd({
    headline: stegaClean(article.title) ?? "",
    description: stegaClean(article.dek) ?? "",
    url: absoluteUrl(canonical),
    imageUrls: [heroImageUrl, ogImageUrl(stegaClean(article.slug) ?? slug)].filter((u): u is string => Boolean(u)),
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    authors: authors.map((a) => ({ name: stegaClean(a.name) ?? "", url: a.slug ? absoluteUrl(authorPath(stegaClean(a.slug))) : undefined })),
    section: stegaClean(school.shortName ?? school.name),
    keywords: (article.tags ?? []).map((t) => stegaClean(t.name) ?? "").filter(Boolean),
  });
  const crumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: stegaClean(school.shortName ?? school.name) ?? "", path: schoolPath(schoolSlug) },
    { name: stegaClean(article.title) ?? "", path: canonical },
  ]);

  return (
    <article data-school={schoolSlug} className="shell py-8 sm:py-12">
      <SchoolTheme slug={schoolSlug} accentColor={school.accentColor} accentColorDark={school.accentColorDark} />
      <JsonLd data={jsonLd} />
      <JsonLd data={crumbs} />

      <div className="mx-auto max-w-4xl">
        {/* 1. Labels */}
        <LabelRow type={article.contentType} school={school} />

        {/* 2. Headline and dek */}
        <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">{article.title}</h1>
        {article.dek && <p className="mt-4 text-xl leading-snug text-fg-muted md:text-2xl">{article.dek}</p>}

        {/* 3. Byline */}
        <div className="mt-6">
          <Byline authors={authors} publishedAt={article.publishedAt} updatedAt={article.updatedAt} />
        </div>

        {/* 4. Hero */}
        {heroType === "image" && <HeroImage image={article.heroImage} />}
        {heroType === "video" && article.heroEmbed?.url && (
          <div className="my-8">
            <YouTubeEmbed url={stegaClean(article.heroEmbed.url)} title={article.heroEmbed.title} />
            <EpisodeNotes summary={article.episodeSummary} timestamps={article.episodeTimestamps} />
          </div>
        )}
        {heroType === "podcast" && article.heroEmbed?.url && (
          <div className="my-8">
            <PodcastEmbed
              provider={stegaClean(article.heroEmbed.provider) ?? "other"}
              url={stegaClean(article.heroEmbed.url)}
              title={article.heroEmbed.title}
              eager
            />
            <EpisodeNotes summary={article.episodeSummary} timestamps={article.episodeTimestamps} />
          </div>
        )}

        {/* 5. Sponsor, only when one matches */}
        <SponsorSlot sponsor={article.sponsor} />

        {/* 6. Body */}
        <PortableTextRenderer value={article.body} />

        {/* 7. Correction */}
        <CorrectionNote text={article.correction} />

        {/* 8. End block */}
        <footer className="measure mt-12 flex flex-col gap-8 border-t border-line pt-8">
          <DiscussInClub
            communityName={stegaClean(school.communityName) ?? "the Club"}
            postUrl={article.circlePostUrl}
            commentCount={article.circleCommentCount}
            joinUrl={joinUrl}
            schoolSlug={schoolSlug}
          />
          {authors.map((a) => (
            <AuthorCard key={a._id} author={a} />
          ))}
          <NewsletterSignup
            headline={settings?.newsletterHeadline}
            blurb={settings?.newsletterBlurb}
            school={schoolSlug}
            location="article_end"
          />
        </footer>
      </div>

      {/* 9. Related */}
      <RelatedStories articles={article.related} />

      <p className="sr-only">
        {contentTypeLabel(stegaClean(article.contentType))} from {school.name}
      </p>
    </article>
  );
}
