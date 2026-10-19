import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sanityFetch } from "@/lib/sanity/fetch";
import { AUTHOR_QUERY } from "@/lib/sanity/queries";
import { pageQuery, parsePage, totalPages } from "@/lib/sanity/paginate";
import { tags } from "@/lib/sanity/tags";
import { urlFor } from "@/lib/sanity/image";
import { authorPath, buildMetadata, profilePageJsonLd } from "@/lib/seo";
import { SanityImage } from "@/components/SanityImage";
import { StoryRow } from "@/components/StoryRow";
import { Pagination } from "@/components/Pagination";
import { JsonLd } from "@/components/JsonLd";

const PER_PAGE = 12;
const SLUG_RE = /^[a-z0-9-]+$/;

const PLATFORM_LABELS: Record<string, string> = {
  x: "X",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  threads: "Threads",
  bluesky: "Bluesky",
  website: "Website",
};

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string | string[] }> };

function getAuthor(slug: string, page: number) {
  if (!SLUG_RE.test(slug)) return Promise.resolve(null);
  return sanityFetch({
    query: pageQuery(AUTHOR_QUERY, "[0...12]", page, PER_PAGE),
    params: { slug },
    tags: [tags.author(slug), tags.authors, tags.articles],
  });
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = parsePage((await searchParams).page) ?? 1;
  const author = await getAuthor(slug, page);
  if (!author?.name) return {};
  return buildMetadata({
    title: page > 1 ? `${author.name}, page ${page}` : author.name,
    description: author.bio ?? `Stories by ${author.name} on Speakeasy Sports.`,
    path: page > 1 ? `${authorPath(slug)}?page=${page}` : authorPath(slug),
    image: author.photo?.asset ? { url: urlFor(author.photo).width(600).height(600).fit("crop").url(), width: 600, height: 600 } : null,
  });
}

export default async function AuthorPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const page = parsePage((await searchParams).page);
  if (!page) notFound();
  const author = await getAuthor(slug, page);
  if (!author?.name) notFound();
  const pages = totalPages(author.count, PER_PAGE);
  if (page > pages) notFound();

  const socials = (author.socialLinks ?? []).filter((s) => s.url);
  const firstName = author.name.split(" ")[0];

  return (
    <div className="shell">
      <JsonLd
        data={profilePageJsonLd({
          name: author.name,
          path: authorPath(slug),
          description: author.bio,
          role: author.role,
          imageUrl: author.photo?.asset ? urlFor(author.photo).width(600).height(600).fit("crop").url() : null,
          sameAs: socials.map((s) => s.url!),
        })}
      />
      <header className="grid gap-8 border-b border-line pb-10 pt-10 sm:grid-cols-[9rem_1fr] sm:items-center sm:gap-10 sm:pt-14">
        <div className="h-28 w-28 overflow-hidden rounded-full bg-line sm:h-36 sm:w-36">
          {author.photo?.asset && (
            <SanityImage image={author.photo} alt={author.name} width={288} aspect={1} sizes="144px" priority className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex flex-col gap-4">
          {author.role && <p className="label-caps text-fg-muted">{author.role}</p>}
          <h1 className="headline text-[2.75rem] leading-[0.98] tracking-[-0.03em] sm:text-[4rem]">{author.name}</h1>
          {author.bio && <p className="max-w-2xl text-lg leading-snug text-fg-muted sm:text-xl">{author.bio}</p>}
          {socials.length > 0 && (
            <ul className="flex flex-wrap gap-2 pt-1">
              {socials.map((s) => (
                <li key={s._key}>
                  <a
                    href={s.url!}
                    rel="me noopener noreferrer"
                    target="_blank"
                    className="inline-flex h-9 items-center rounded-full border border-line bg-bg-elev px-4 font-ui text-[0.8125rem] font-medium text-fg no-underline transition-colors hover:border-fg"
                  >
                    {PLATFORM_LABELS[s.platform ?? ""] ?? s.platform}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      <section aria-labelledby="author-stories-h" className="mt-12 max-w-4xl">
        <h2 id="author-stories-h" className="rule-heading">
          {author.count === 1 ? "1 story" : `${author.count} stories`} by {firstName}
        </h2>
        {author.articles.length > 0 ? (
          <div className="divide-y divide-line">
            {author.articles.map((a) => (
              <StoryRow key={a._id} article={a} hideAuthors />
            ))}
          </div>
        ) : (
          <p className="py-10 font-ui text-fg-muted">No stories yet.</p>
        )}
        <Pagination page={page} total={pages} href={(n) => (n === 1 ? authorPath(slug) : `${authorPath(slug)}?page=${n}`)} />
      </section>
    </div>
  );
}
