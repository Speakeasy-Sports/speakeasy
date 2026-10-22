// Shape of the Sanity webhook body. The projection that produces it is in docs/setup.md ("Sanity webhooks").
// Pure functions, unit tested; nothing here touches the network.
import { tags } from "@/lib/sanity/tags";

export type SanityWebhookPayload = {
  _id: string;
  _type: string;
  operation: "create" | "update" | "delete" | null;
  slug: string | null;
  previousSlug: string | null;
  status: string | null;
  previousStatus: string | null;
  /** True when title or dek changed in this mutation; drives the Circle post update. */
  textChanged: boolean;
};

const str = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null);

export function parsePayload(raw: unknown): SanityWebhookPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = str(r._id);
  const type = str(r._type);
  if (!id || !type) return null;
  const op = r.operation;
  return {
    _id: id,
    _type: type,
    operation: op === "create" || op === "update" || op === "delete" ? op : null,
    slug: str(r.slug),
    previousSlug: str(r.previousSlug),
    status: str(r.status),
    previousStatus: str(r.previousStatus),
    textChanged: r.textChanged === true,
  };
}

/** Drafts and release versions ("drafts.x", "versions.r.x") are not live content. */
export function isDraftOrVersion(id: string): boolean {
  return id.startsWith("drafts.") || id.startsWith("versions.");
}

/** A contributor moved a draft into review. Only these send the editor email. */
export function isReviewTransition(p: SanityWebhookPayload): boolean {
  return p._type === "article" && p.status === "review" && p.previousStatus !== "review" && p.operation !== "delete";
}

function slugs(p: SanityWebhookPayload): string[] {
  return [...new Set([p.slug, p.previousSlug].filter((s): s is string => !!s))];
}

/** Cache tags to revalidate for a published change. The table this follows is in lib/sanity/tags.ts. */
export function tagsForChange(p: SanityWebhookPayload): string[] {
  const s = slugs(p);
  switch (p._type) {
    case "article":
      return [...s.map(tags.articleSlug), tags.articles, tags.home];
    case "school":
      return [...s.map(tags.school), tags.schools, tags.articles, tags.home];
    case "author":
      return [...s.map(tags.author), tags.authors, tags.articles];
    case "tag":
      return [...s.map(tags.tag), tags.taxonomy, tags.articles];
    case "infoPage":
      return [...s.map(tags.page), tags.pages];
    case "siteSettings":
      return [tags.settings];
    case "frontPage":
      // School fronts with no picks of their own use the home picks that cover them, so they refresh too.
      return [tags.home, tags.schools];
    case "sponsorSlot":
      return [tags.sponsors];
    default:
      return [];
  }
}
