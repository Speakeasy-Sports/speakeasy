import { client } from "@/lib/sanity/client";
import { SEARCH_INDEX_QUERY } from "@/lib/sanity/queries";
import { tags } from "@/lib/sanity/tags";

// Prebuilt client-side search index (AGENTS.md section 6). Regenerated when articles change, via the `articles` tag.
export const revalidate = 300;

export async function GET() {
  const index = await client.fetch(SEARCH_INDEX_QUERY, {}, { next: { revalidate: 300, tags: [tags.articles] } });
  return Response.json(index, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
  });
}
