/**
 * Interface copy editors can change in Site settings > Copy. Each entry's `default` is what the site shows while the
 * Studio field is empty, and the Studio shows it as the field's placeholder, so a blank field never blanks the page.
 * `{community}` and `{school}` in a string are filled in where the copy is used; `tokens` lists which ones apply.
 *
 * Adding an entry here adds the Studio field. Renaming one needs a migration script (AGENTS.md section 14).
 */
// `max` is the Studio length limit. Buttons are short because they never wrap (the header has 390px on a phone).
type Entry = { title: string; default: string; description?: string; tokens?: readonly CopyToken[]; long?: boolean; max?: number };
export type CopyToken = "community" | "school";

export const COPY_SPEC = {
  join: {
    title: "Join the Club",
    fields: {
      headerButton: { title: "Header button", default: "Join the Club", max: 18 },
      schoolButton: {
        title: "School header button",
        default: "Join {community}",
        tokens: ["community"],
        description: "On each school front.",
        max: 32,
      },
      cardKicker: { title: "Promo card label", default: "The Club", max: 24 },
      homeCardHeadline: {
        title: "Promo card headline, home",
        default: "Join the Club",
        description: "School fronts use the school's community name.",
      },
      cardBody: {
        title: "Promo card text",
        default: "Free to join. Every story here gets its own thread there, with the people who watch every snap.",
        long: true,
      },
      cardButton: { title: "Promo card button", default: "Join free", max: 24 },
      discussButton: {
        title: "Article discuss button",
        default: "Discuss in {community}",
        tokens: ["community"],
        max: 40,
      },
    },
  },
  newsletter: {
    title: "Newsletter form",
    fields: {
      kicker: { title: "Label above the headline", default: "Newsletter", max: 24 },
      button: { title: "Button", default: "Sign up", max: 20 },
      success: { title: "After signing up", default: "You are on the list. The next issue comes to your inbox.", long: true },
      finePrint: { title: "Fine print", default: "Free. Unsubscribe anytime." },
      sampleLink: { title: "Sample issue link", default: "Read a sample issue", description: "Shown when a sample issue URL is set." },
      recentHeading: { title: "Newsletter page, recent stories heading", default: "Recently on Speakeasy" },
    },
  },
  article: {
    title: "Article page",
    fields: {
      writePrompt: {
        title: "Write for us prompt",
        default: "Want to cover {school}?",
        tokens: ["school"],
        description: "At the end of every article, before the link.",
      },
      writeLink: { title: "Write for us link", default: "Write for Speakeasy" },
      relatedHeading: { title: "Related stories heading", default: "More to read" },
    },
  },
  fronts: {
    title: "Front pages",
    fields: {
      emptyKicker: { title: "No stories yet, label", default: "Nothing yet", max: 24 },
      emptyHeadline: { title: "No stories yet, headline", default: "The first stories are on the way." },
      latestEmpty: { title: "Latest list empty", default: "Everything new is in the stories above." },
      mediaRailHeading: { title: "Podcasts and videos rail heading", default: "Listen and watch" },
    },
  },
  media: {
    title: "Podcasts and Videos pages",
    fields: {
      podcastsKicker: { title: "Podcasts label", default: "Listen", max: 24 },
      podcastsIntro: { title: "Podcasts intro", default: "Every episode, newest first.", long: true },
      podcastsEmpty: { title: "Podcasts empty", default: "No episodes yet." },
      videosKicker: { title: "Videos label", default: "Watch", max: 24 },
      videosIntro: { title: "Videos intro", default: "Film breakdowns, press conferences, and the rest, newest first.", long: true },
      videosEmpty: { title: "Videos empty", default: "No videos yet." },
    },
  },
  writeForUs: {
    title: "Write for us form",
    fields: {
      kicker: { title: "Label above the heading", default: "Apply", max: 24 },
      heading: { title: "Heading", default: "Tell us about yourself" },
      button: { title: "Button", default: "Send application", max: 30 },
      successTitle: { title: "After applying", default: "Thanks. Your application is in." },
      responseTime: {
        title: "Reply promise",
        default: "We read every application and reply within a week.",
        description: "Under the form and after applying.",
      },
    },
  },
  notFound: {
    title: "Page not found",
    fields: {
      headline: { title: "Headline", default: "That page is not here" },
      body: { title: "Text", default: "It may have moved, or the link was wrong." },
      link: { title: "Link back", default: "Back to the front page" },
    },
  },
  footer: {
    title: "Footer",
    fields: {
      signoff: { title: "Sign-off after the copyright", default: "Built for fans." },
    },
  },
} as const satisfies Record<string, { title: string; fields: Record<string, Entry> }>;

type Spec = typeof COPY_SPEC;
export type SiteCopy = { -readonly [S in keyof Spec]: { -readonly [F in keyof Spec[S]["fields"]]: string } };

/** What Sanity returns for the `copy` field: any section or string may be missing. */
export type RawCopy = { [S in keyof Spec]?: { [F in keyof Spec[S]["fields"]]?: string | null } | null } | null | undefined;

/** Every string, with the default wherever the Studio field is empty or only whitespace. */
export function resolveCopy(raw: RawCopy): SiteCopy {
  const out: Record<string, Record<string, string>> = {};
  for (const [section, { fields }] of Object.entries(COPY_SPEC)) {
    const given = (raw as Record<string, Record<string, string | null | undefined> | null | undefined> | null | undefined)?.[section];
    out[section] = {};
    for (const [key, entry] of Object.entries(fields as Record<string, Entry>)) {
      const value = given?.[key]?.trim();
      out[section][key] = value || entry.default;
    }
  }
  return out as SiteCopy;
}

/** Fills `{community}` and `{school}`. An unknown or missing token is left as typed so the mistake is visible. */
export function fillCopy(template: string, values: Partial<Record<CopyToken, string | null | undefined>>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => values[name as CopyToken] ?? match);
}

/** The period that closes a sentence ending in a link, unless the editor's link text already ends it. */
export function closingPeriod(text: string): string {
  return /[.!?]$/.test(text.trim()) ? "" : ".";
}

/** Studio check: the tokens a string uses must be ones its field supports. */
export function unknownTokens(value: string, allowed: readonly CopyToken[] = []): string[] {
  return [...value.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1] ?? "")
    .filter((t) => !(allowed as readonly string[]).includes(t));
}
