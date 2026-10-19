"use client";

import { track } from "@/lib/analytics/plausible";

type Props = {
  communityName: string;
  postUrl: string | null | undefined;
  commentCount: number | null | undefined;
  joinUrl: string;
  schoolSlug?: string | null;
};

/** Button to the Circle post with its comment count. Falls back to the school join URL until the post exists. */
export function DiscussInClub({ communityName, postUrl, commentCount, joinUrl, schoolSlug }: Props) {
  const href = postUrl || joinUrl;
  const count = typeof commentCount === "number" && postUrl ? commentCount : null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={href}
        onClick={() => track({ name: "discuss_click", props: { school: schoolSlug ?? undefined } })}
        className="inline-flex items-center gap-2 rounded-base bg-accent px-5 py-3 font-ui text-base font-semibold text-accent-fg no-underline transition-opacity hover:opacity-90"
      >
        Discuss in {communityName}
      </a>
      {count !== null && (
        <span className="font-ui text-sm text-fg-muted">
          {count} {count === 1 ? "comment" : "comments"}
        </span>
      )}
    </div>
  );
}
