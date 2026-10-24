import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { stegaClean } from "@sanity/client/stega";
import { client } from "@/lib/sanity/client";
import { ARTICLE_SLUGS_QUERY } from "@/lib/sanity/queries";
import { articlePath, NATIONAL_SLUG } from "@/lib/seo";
import { ArticleView, articleMetadata, getArticle } from "../../_views/ArticleView";

// Same caching as school articles: newest prerendered, the rest on first request, revalidated on publish.
export const revalidate = 60;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  try {
    const rows = await client.fetch(ARTICLE_SLUGS_QUERY, {}, { useCdn: false });
    return rows.filter((r): r is typeof r & { slug: string } => r.scope === "national" && Boolean(r.slug)).map((r) => ({ slug: r.slug }));
  } catch (err) {
    console.warn("generateStaticParams(national article): could not list slugs", err);
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug, NATIONAL_SLUG, false);
  if (!article || article.scope !== "national") return {};
  return articleMetadata(article, slug);
}

/** /national/{slug}. A school story requested here 301s to its school URL (docs/specs/phase-1-ux-update.md, 3.3). */
export default async function NationalArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug, NATIONAL_SLUG);
  if (!article?.slug) notFound();
  if (article.scope !== "national") {
    if (article.school?.slug) permanentRedirect(articlePath(stegaClean(article.school.slug), stegaClean(article.slug)));
    notFound();
  }
  return <ArticleView article={article} slug={slug} />;
}
