"use client";

import { track, type PlausibleEvent } from "@/lib/analytics/plausible";

/** Sends one Plausible event when any link inside is clicked, so server-rendered cards can be tracked as a unit. */
export function TrackClicks({ event, className, children }: { event: PlausibleEvent; className?: string; children: React.ReactNode }) {
  return (
    <div
      className={className}
      onClickCapture={(e) => {
        if ((e.target as HTMLElement).closest("a")) track(event);
      }}
    >
      {children}
    </div>
  );
}
