import { client } from "@/lib/sanity/client";
import { SCHOOL_FEED_QUERY } from "@/lib/sanity/queries";
import { tags } from "@/lib/sanity/tags";
import { isReservedSlug } from "@/lib/reserved-slugs";
import { buildFeed, FEED_HEADERS } from "@/lib/feed";
import { SITE_NAME } from "@/lib/seo";

export const revalidate = 300;

type Ctx = { params: Promise<{ school: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { school: slug } = await params;
  if (isReservedSlug(slug) || !/^[a-z0-9-]+$/.test(slug)) return new Response("Not found", { status: 404 });

  const school = await client.fetch(SCHOOL_FEED_QUERY, { slug }, { next: { revalidate: 300, tags: [tags.school(slug), tags.articles] } });
  if (!school?.slug) return new Response("Not found", { status: 404 });

  const xml = buildFeed({
    title: `${school.name ?? school.shortName} | ${SITE_NAME}`,
    description: school.description ?? `${school.shortName} stories from ${SITE_NAME}.`,
    path: `/${slug}`,
    feedPath: `/${slug}/feed.xml`,
    items: school.items,
  });
  return new Response(xml, { headers: FEED_HEADERS });
}
