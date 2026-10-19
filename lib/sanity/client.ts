import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId, studioUrl } from "./env";

// SANITY_API_HOST is only set by local smoke tests that point the client at scripts/mock-sanity.mjs.
const apiHost = process.env.SANITY_API_HOST;

// Published content over the CDN. Used for every public render.
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: !apiHost,
  perspective: "published",
  stega: { enabled: false, studioUrl },
  ...(apiHost ? { apiHost, useProjectHostname: false } : {}),
});
