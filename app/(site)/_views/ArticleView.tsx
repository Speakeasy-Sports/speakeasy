import type { Metadata } from "next";
import Link from "next/link";
import { stegaClean } from "@sanity/client/stega";
import { sanityFetch } from "@/lib/sanity/fetch";
import { ARTICLE_QUERY } from "@/lib/sanity/queries";
import { getSiteSettings, getSiteSignals } from "@/lib/sanity/loaders";
import { articlePageTags } from "@/lib/sanity/tags";
import { urlFor } from "@/lib/sanity/image";
import { closingPeriod, fillCopy, resolveCopy } from "@/lib/site-copy";
import { contentTypeLabel } from "@/lib/content-types";
import { absoluteUrl, authorPath, breadcrumbJsonLd, buildMetadata, NATIONAL_SLUG, newsArticleJsonLd, ogImageUrl, schoolPath, storyPath } from "@/lib/seo";
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
import { ReadNext } from "@/components/ReadNext";
import { CommunityInvite } from "@/components/CommunityInvite";
import { SchoolTheme } from "@/components/SchoolTheme";
import { JsonLd } from "@/components/JsonLd";

const SLUG_RE = /^[a-z0-9-]+$/;

/** One article by slug. `section` is the school slug or "national" from the URL, used only for cache tags. */
export function getArticle(slug: string, section: string, stega = true) {
  if (!SLUG_RE.test(slug)) return Promise.resolve(null);
  return sanityFetch({ query: ARTICLE_QUERY, params: { slug }, tags: articlePageTags(slug, section), stega });
}

type LoadedArticle = NonNullable<Awaited<ReturnType<typeof getArticle>>>;

/** "National" for national stories, the school's short name otherwise. */
function sectionName(article: Pick<LoadedArticle, "scope" | "school">): string {
  if (article.scope === "national") return "National";
  return stegaClean(article.school?.shortName ?? article.school?.name) ?? "";
}

export function articleMetadata(article: LoadedArticle, slug: string): Metadata {
  const path = storyPath({ ...article, slug: stegaClean(article.slug) ?? slug, school: article.school ? { slug: stegaClean(article.school.slug) } : null });
  if (!path) return {};
  const image = article.ogImageOverride?.asset
    ? {
        url: urlFor(article.ogImageOverride).width(1200).height(630).fit("crop").url(),
        width: 1200,
        height: 630,
        alt: article.ogImageOverride.alt ?? undefined,
      }
    : { url: ogImageUrl(article.slug ?? slug), width: 1200, height: 630 };

  return buildMetadata({
    title: article.seoTitle ?? article.title ?? "",
    description: article.seoDescription ?? article.dek,
    path,
    image,
    type: "article",
    noIndex: article.noIndex,
    article: {
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt ?? article.publishedAt,
      authors: (article.authors ?? []).map((a) => a.name).filter((n): n is string => Boolean(n)),
      section: sectionName(article),
      tags: (article.tags ?? []).map((t) => t.name).filter((n): n is string => Boolean(n)),
    },
  });
}

/**
 * The article page for both scopes (AGENTS.md section 6; docs/specs/phase-1-ux-update.md, 3). The route has already
 * checked that the requested URL is canonical. National stories use the neutral brand treatment and never link to a
 * school's Circle space.
 */
export async function ArticleView({ article, slug }: { article: LoadedArticle; slug: string }) {
  const [settings, signals] = await Promise.all([getSiteSettings(), getSiteSignals()]);
  const national = article.scope === "national";
  const school = national ? null : article.school;
  const schoolSlug = school ? stegaClean(school.slug) : null;
  const heroType = stegaClean(article.heroType);
  const canonical = storyPath({ scope: article.scope, slug: stegaClean(article.slug) ?? slug, school: schoolSlug ? { slug: schoolSlug } : null })!;
  // A school story goes to its club: the thread once posted, else the club's join page. Anything else, including a
  // school without a club, points to /community, so national readers are never sent to one school's signup.
  const postUrl = school ? stegaClean(article.circlePostUrl) : null;
  const clubJoinUrl = school ? stegaClean(school.circleJoinUrl) : null;
  const [readNext, ...moreToRead] = (article.related ?? []).filter((a) => a.path);
  const copy = resolveCopy(settings?.copy);
  const community = (school && stegaClean(school.communityName)) || "the Club";
  const comments = postUrl && typeof article.circleCommentCount === "number" ? article.circleCommentCount : 0;
  const clubLead =
    comments > 0
      ? fillCopy(copy.join.articleLeadWithCount, { community, count: `${comments} ${comments === 1 ? "comment" : "comments"}` })
      : fillCopy(copy.join.articleLead, { community });
  const authors = (article.authors ?? []).filter((a) => a.name);
  const section = sectionName(article);

  const heroImageUrl = heroType === "image" && article.heroImage?.asset ? urlFor(article.heroImage).width(1200).height(675).fit("crop").url() : null;

  const jsonLd = newsArticleJsonLd({
    headline: stegaClean(article.title) ?? "",
    description: stegaClean(article.dek) ?? "",
    url: absoluteUrl(canonical),
    // Text-only stories still give search engines an image: the generated social card.
    imageUrls: [heroImageUrl, ogImageUrl(stegaClean(article.slug) ?? slug)].filter((u): u is string => Boolean(u)),
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    authors: authors.map((a) => ({ name: stegaClean(a.name) ?? "", url: a.slug ? absoluteUrl(authorPath(stegaClean(a.slug))) : undefined })),
    section,
    keywords: (article.tags ?? []).map((t) => stegaClean(t.name) ?? "").filter(Boolean),
  });
  const crumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: section, path: schoolSlug ? schoolPath(schoolSlug) : `/${NATIONAL_SLUG}` },
    { name: stegaClean(article.title) ?? "", path: canonical },
  ]);

  return (
    <article data-school={schoolSlug ?? undefined} className="shell py-8 sm:py-12">
      {school && schoolSlug && <SchoolTheme slug={schoolSlug} accentColor={school.accentColor} accentColorDark={school.accentColorDark} />}
      <JsonLd data={jsonLd} />
      <JsonLd data={crumbs} />

      <div className="mx-auto max-w-4xl">
        <header className="measure mb-8 md:mb-10">
          {/* 1. Labels */}
          <LabelRow type={article.contentType} scope={article.scope} school={school} />

          {/* 2. Headline and dek */}
          <h1 className="headline mt-3 text-4xl leading-[1.06] tracking-[-0.022em] md:text-5xl">{article.title}</h1>
          {article.dek && <p className="mt-4 text-xl leading-[1.35] text-fg-muted md:text-2xl">{article.dek}</p>}

          {/* 3. Byline */}
          <div className="mt-6">
            <Byline authors={authors} publishedAt={article.publishedAt} updatedAt={article.updatedAt} />
          </div>
        </header>

        {/* 4. Hero */}
        {heroType === "image" && <HeroImage image={article.heroImage} />}
        {heroType === "video" && article.heroEmbed?.url && (
          <div className="mb-8">
            <YouTubeEmbed url={stegaClean(article.heroEmbed.url)} title={article.heroEmbed.title} />
            <EpisodeNotes summary={article.episodeSummary} timestamps={article.episodeTimestamps} />
          </div>
        )}
        {heroType === "podcast" && article.heroEmbed?.url && (
          <div className="mb-8">
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

        {/* 8. Read next, then the end block */}
        <ReadNext article={readNext} heading={copy.article.readNextHeading} />
        <footer className="measure mt-12 flex flex-col divide-y divide-line border-t border-line [&>*]:py-6 [&>*:last-child]:pb-0">
          <div className="flex flex-col gap-3">
            {authors.map((a) => (
              <AuthorCard key={a._id} author={a} />
            ))}
            <p className="font-ui text-sm text-fg-muted">
              {fillCopy(copy.article.writePrompt, { school: (school && stegaClean(school.shortName)) || "college sports" })}{" "}
              <Link href="/write-for-us" className="text-fg underline decoration-line underline-offset-4 hover:decoration-fg">
                {copy.article.writeLink}
              </Link>
              {closingPeriod(copy.article.writeLink)}
            </p>
          </div>
          <NewsletterSignup
            headline={settings?.newsletterHeadline}
            blurb={settings?.newsletterBlurb}
            sampleUrl={settings?.newsletterSampleUrl}
            school={schoolSlug ?? undefined}
            copy={copy.newsletter}
            location="article_end"
          />
          {school && (postUrl || clubJoinUrl) ? (
            <DiscussInClub
              lead={clubLead}
              label={fillCopy(copy.join.discussButton, { community })}
              joinLabel={fillCopy(copy.join.schoolButton, { community })}
              postUrl={postUrl}
              joinUrl={clubJoinUrl ?? postUrl ?? ""}
              schoolSlug={schoolSlug}
            />
          ) : (
            article.openClub && (
              <CommunityInvite
                title={copy.article.communityTitle}
                body={fillCopy(copy.article.communityBody, { community: stegaClean(article.openClub) ?? "" })}
              />
            )
          )}
        </footer>
      </div>

      {/* 9. More to read */}
      <RelatedStories articles={moreToRead} heading={copy.article.relatedHeading} hideAuthors={signals.singleAuthor} />

      <p className="sr-only">
        {contentTypeLabel(stegaClean(article.contentType))} from {national ? "National" : school?.name}
      </p>
    </article>
  );
}
