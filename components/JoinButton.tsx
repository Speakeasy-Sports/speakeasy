"use client";

import { track } from "@/lib/analytics/plausible";

type Props = {
  href: string;
  location: "header" | "article_end" | "school_header";
  children?: React.ReactNode;
  className?: string;
};

export function JoinButton({ href, location, children = "Join the Club", className = "" }: Props) {
  return (
    <a
      href={href}
      onClick={() => track({ name: "join_click", props: { location } })}
      className={`inline-flex items-center justify-center rounded-base bg-accent px-4 py-2 font-ui text-sm font-semibold text-accent-fg no-underline transition-opacity hover:opacity-90 ${className}`}
    >
      {children}
    </a>
  );
}
