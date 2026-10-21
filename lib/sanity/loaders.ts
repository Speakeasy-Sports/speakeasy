import "server-only";
import { sanityFetch } from "./fetch";
import { SITE_SETTINGS_QUERY, SITE_SIGNALS_QUERY } from "./queries";
import { deriveSignals, type SiteSignals } from "@/lib/site-signals";
import { tags } from "./tags";

export function getSiteSettings() {
  return sanityFetch({
    query: SITE_SETTINGS_QUERY,
    tags: [tags.settings, tags.schools],
    revalidate: 300,
    stega: false,
  });
}

/** Launch-stage switches derived from what is published. Tagged by articles and authors so a publish flips them. */
export async function getSiteSignals(): Promise<SiteSignals> {
  const counts = await sanityFetch({
    query: SITE_SIGNALS_QUERY,
    tags: [tags.articles, tags.authors],
    revalidate: 300,
    stega: false,
  });
  return deriveSignals(counts);
}
