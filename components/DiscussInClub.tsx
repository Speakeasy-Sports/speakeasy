"use client";

import { track } from "@/lib/analytics/plausible";

type Props = {
  /** One line above the button, already filled in, for example "12 comments so far in Dawg Social Club." */
  lead: string;
  /** Button text when the post exists, already filled in, for example "Discuss in Dawg Social Club". */
  label: string;
  /** Button text before the post exists, for example "Join Dawg Social Club". */
  joinLabel: string;
  postUrl: string | null | undefined;
  joinUrl: string;
  schoolSlug?: string | null;
};

/**
 * One line about the conversation, then the button to the Circle post. Until the post exists the button says what it
 * does: join the school's club (docs/specs/phase-1-ux-update.md, 6.3). The comment count lives in the line (design
 * sweep F15), so the button never stands alone.
 */
export function DiscussInClub({ lead, label, joinLabel, postUrl, joinUrl, schoolSlug }: Props) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="font-ui text-base text-fg">{lead}</p>
      <a
        href={postUrl || joinUrl}
        onClick={() =>
          postUrl
            ? track({ name: "discuss_click", props: { school: schoolSlug ?? undefined } })
            : track({ name: "join_click", props: { location: "article_end" } })
        }
        className="inline-flex items-center gap-2 rounded-base bg-accent px-5 py-3 font-ui text-base font-semibold text-accent-fg no-underline transition-colors hover-accent-shift"
      >
        {postUrl ? label : joinLabel}
      </a>
    </div>
  );
}
