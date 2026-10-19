import "server-only";
import { createClient, type SanityClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "./env";
import { writeToken } from "./token";

// Server-only client for the webhook handlers. Raw perspective so it sees drafts and release versions by id.
let cached: SanityClient | null = null;

export function getWriteClient(): SanityClient {
  if (!writeToken) throw new Error("SANITY_API_WRITE_TOKEN is not set");
  cached ??= createClient({ projectId, dataset, apiVersion, token: writeToken, useCdn: false, perspective: "raw" });
  return cached;
}
