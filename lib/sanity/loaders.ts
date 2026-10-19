import "server-only";
import { sanityFetch } from "./fetch";
import { SITE_SETTINGS_QUERY } from "./queries";
import { tags } from "./tags";

export function getSiteSettings() {
  return sanityFetch({
    query: SITE_SETTINGS_QUERY,
    tags: [tags.settings, tags.schools],
    revalidate: 300,
    stega: false,
  });
}
