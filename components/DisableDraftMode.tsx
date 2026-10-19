"use client";

import { useVisualEditingEnvironment } from "next-sanity/hooks";

/** Shown only when previewing outside the Studio's Presentation tool. */
export function DisableDraftMode() {
  const environment = useVisualEditingEnvironment();
  // Inside the Presentation tool the Studio owns the preview state; the button only matters in a plain tab.
  if (environment !== "standalone") return null;
  return (
    // A plain anchor on purpose: this is a route handler that clears the cookie and redirects, not a page.
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a
      href="/api/draft/disable"
      className="fixed bottom-4 right-4 z-50 rounded-base border border-line bg-bg-elev px-4 py-2 font-ui text-sm shadow-lg no-underline"
    >
      Exit preview
    </a>
  );
}
