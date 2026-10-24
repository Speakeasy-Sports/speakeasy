"use client";

import { track } from "@/lib/analytics/plausible";

type Props = {
  href: string;
  location: "article_end" | "school_header" | "rail" | "community_page";
  children?: React.ReactNode;
  className?: string;
};

export function JoinButton({ href, location, children = "Join the Club", className = "" }: Props) {
  return (
    <a
      href={href}
      onClick={() => track({ name: "join_click", props: { location } })}
      className={`inline-flex h-10 items-center justify-center whitespace-nowrap rounded-base bg-accent px-4 font-ui text-sm font-semibold text-accent-fg no-underline transition-opacity hover:opacity-90 ${className}`}
    >
      {children}
    </a>
  );
}
