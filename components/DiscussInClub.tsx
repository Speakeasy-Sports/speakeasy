"use client";

import { track } from "@/lib/analytics/plausible";

type Props = {
  /** Button text when the post exists, already filled in, for example "Discuss in Dawg Social Club". */
  label: string;
  /** Button text before the post exists, for example "Join Dawg Social Club". */
  joinLabel: string;
  postUrl: string | null | undefined;
  commentCount: number | null | undefined;
  joinUrl: string;
  schoolSlug?: string | null;
};

/**
 * Button to the Circle post with its comment count. Until the post exists it says what it does: join the school's
 * club (docs/specs/phase-1-ux-update.md, 6.3).
 */
export function DiscussInClub({ label, joinLabel, postUrl, commentCount, joinUrl, schoolSlug }: Props) {
  const count = typeof commentCount === "number" && postUrl ? commentCount : null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={postUrl || joinUrl}
        onClick={() =>
          postUrl
            ? track({ name: "discuss_click", props: { school: schoolSlug ?? undefined } })
            : track({ name: "join_click", props: { location: "article_end" } })
        }
        className="inline-flex items-center gap-2 rounded-base bg-accent px-5 py-3 font-ui text-base font-semibold text-accent-fg no-underline transition-opacity hover:opacity-90"
      >
        {postUrl ? label : joinLabel}
      </a>
      {count !== null && (
        <span className="font-ui text-sm text-fg-muted">
          {count} {count === 1 ? "comment" : "comments"}
        </span>
      )}
    </div>
  );
}
