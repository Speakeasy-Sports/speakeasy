import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { stegaClean } from "@sanity/client/stega";
import { client } from "@/lib/sanity/client";
import { ARTICLE_SLUGS_QUERY } from "@/lib/sanity/queries";
import { isReservedSlug } from "@/lib/reserved-slugs";
import { articlePath, nationalArticlePath } from "@/lib/seo";
import { ArticleView, articleMetadata, getArticle } from "../../_views/ArticleView";

// ISR: the newest articles are prerendered at build, the rest on first request, all revalidated every 60s
// and on demand from the webhook. generateStaticParams is what makes Next treat the route as static.
export const revalidate = 60;
export const dynamicParams = true;

type Props = { params: Promise<{ school: string; slug: string }> };

export async function generateStaticParams() {
  try {
    const rows = await client.fetch(ARTICLE_SLUGS_QUERY, {}, { useCdn: false });
    return rows
      .filter((r): r is typeof r & { slug: string; school: string } => r.scope === "school" && Boolean(r.slug && r.school))
      .map((r) => ({ school: r.school, slug: r.slug }));
  } catch (err) {
    // A Sanity outage at build time should not fail the deploy; pages render on first request instead.
    console.warn("generateStaticParams(article): could not list slugs", err);
    return [];
  }
}

type Article = NonNullable<Awaited<ReturnType<typeof getArticle>>>;

/**
 * Canonical is /{primarySchool}/{slug} for school stories (AGENTS.md section 6) and /national/{slug} for national
 * ones. A school story requested under another school it lists, or a national story requested under any school,
 * 301s to its canonical URL. Returns the article when the path is canonical, otherwise redirects or 404s.
 */
function resolveCanonical(article: Article | null, requestedSchool: string): Article {
  if (!article?.slug) notFound();
  const slug = stegaClean(article.slug);
  if (article.scope === "national") permanentRedirect(nationalArticlePath(slug));
  if (!article.school?.slug) notFound();
  const canonicalSchool = stegaClean(article.school.slug);
  if (canonicalSchool === requestedSchool) return article;
  const listed = (article.schools ?? []).some((s) => stegaClean(s.slug) === requestedSchool);
  if (listed) permanentRedirect(articlePath(canonicalSchool, slug));
  notFound();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { school, slug } = await params;
  if (isReservedSlug(school)) return {};
  const article = await getArticle(slug, school, false);
  if (!article || article.scope !== "school" || article.school?.slug !== school) return {};
  return articleMetadata(article, slug);
}

export default async function ArticlePage({ params }: Props) {
  const { school, slug } = await params;
  if (isReservedSlug(school)) notFound();
  const article = resolveCanonical(await getArticle(slug, school), school);
  return <ArticleView article={article} slug={slug} />;
}
