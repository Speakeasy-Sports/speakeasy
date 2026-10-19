import { client } from "@/lib/sanity/client";
import { FEED_QUERY } from "@/lib/sanity/queries";
import { tags } from "@/lib/sanity/tags";
import { buildFeed, FEED_HEADERS } from "@/lib/feed";
import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export const revalidate = 300;

export async function GET() {
  const items = await client.fetch(FEED_QUERY, {}, { next: { revalidate: 300, tags: [tags.articles] } });
  const xml = buildFeed({ title: SITE_NAME, description: DEFAULT_DESCRIPTION, path: "/", feedPath: "/feed.xml", items });
  return new Response(xml, { headers: FEED_HEADERS });
}
