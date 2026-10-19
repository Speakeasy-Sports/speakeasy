import "server-only";
import { draftMode } from "next/headers";
import type { ClientReturn, QueryParams } from "next-sanity";
import { client } from "./client";
import { readToken } from "./token";

export const DEFAULT_REVALIDATE = 60;

type FetchOptions<Q extends string> = {
  query: Q;
  params?: QueryParams;
  /** Cache tags, for example article:{id}, school:{slug}, home. */
  tags: string[];
  revalidate?: number;
  /** Set false for metadata and anything that lands in <head>. Stega only applies in draft mode. */
  stega?: boolean;
};

/**
 * One fetch helper for every page (AGENTS.md 7.1).
 * Published: CDN, ISR, tagged for revalidation from the Sanity webhook.
 * Draft mode: API host, drafts perspective, read token, no cache, stega on for visual editing.
 */
export async function sanityFetch<const Q extends string>({
  query,
  params = {},
  tags,
  revalidate = DEFAULT_REVALIDATE,
  stega = true,
}: FetchOptions<Q>): Promise<ClientReturn<Q>> {
  const isDraft = (await draftMode()).isEnabled;

  if (isDraft) {
    if (!readToken) throw new Error("Draft mode requires SANITY_API_READ_TOKEN");
    return client.fetch(query, params, {
      token: readToken,
      perspective: "drafts",
      useCdn: false,
      stega,
      cache: "no-store",
    });
  }

  return client.fetch(query, params, {
    next: { revalidate, tags },
  });
}
