import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sanityFetch } from "@/lib/sanity/fetch";
import { INFO_PAGE_QUERY } from "@/lib/sanity/queries";
import { tags } from "@/lib/sanity/tags";
import { formatLongDate } from "@/lib/format/date";
import { getSiteSettings } from "@/lib/sanity/loaders";
import { buildMetadata, defaultOgImage } from "@/lib/seo";
import { PortableTextRenderer } from "@/components/PortableTextRenderer";
import type { ArticleBody } from "@/lib/types";

export type InfoSlug = "about" | "contact" | "terms" | "privacy" | "write-for-us";

function getPage(slug: InfoSlug) {
  return sanityFetch({ query: INFO_PAGE_QUERY, params: { slug }, tags: [tags.page(slug), tags.pages], revalidate: 3600 });
}

export async function infoPageMetadata(slug: InfoSlug): Promise<Metadata> {
  const [page, settings] = await Promise.all([getPage(slug), getSiteSettings()]);
  if (!page?.title) return {};
  return buildMetadata({ title: page.title, description: page.intro, path: `/${slug}`, fallbackImage: defaultOgImage(settings) });
}

/**
 * About, Contact, Terms, Privacy, Write for us. Copy lives in the Studio under Pages; a missing page is a 404, not
 * filler. `after` renders under the body (the Write for us form) and replaces the "Last updated" line.
 */
export async function InfoPageView({ slug, after }: { slug: InfoSlug; after?: React.ReactNode }) {
  const page = await getPage(slug);
  if (!page?.title) notFound();

  return (
    <article className="shell">
      <header className="mx-auto flex max-w-[42rem] flex-col gap-5 border-b border-line pb-10 pt-12 sm:pt-20">
        <p className="label-caps text-fg-muted">Speakeasy Sports</p>
        <h1 className="headline text-[2.75rem] leading-[0.98] tracking-[-0.03em] sm:text-[4rem]">{page.title}</h1>
        {page.intro && <p className="text-xl leading-snug text-fg-muted">{page.intro}</p>}
      </header>
      <div className="mx-auto max-w-[42rem] pt-10">
        <PortableTextRenderer value={page.body as ArticleBody | null} />
        {after ?? (
          <p className="mt-12 border-t border-line pt-6 font-ui text-[0.8125rem] text-fg-subtle">
            Last updated <time dateTime={page._updatedAt}>{formatLongDate(page._updatedAt)}</time>
          </p>
        )}
      </div>
    </article>
  );
}
