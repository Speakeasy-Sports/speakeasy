"use client";

import dynamic from "next/dynamic";

/**
 * Rendered only while draft mode is on. The visual editing runtime (xstate, comlink, framer-motion,
 * styled-components, roughly 200KB gzipped) is split into an async chunk that loads when this mounts,
 * so it stays out of every reader's script list. A server-side import, even a conditional one, would
 * still put those chunks in the route's client manifest.
 */
const VisualEditing = dynamic(() => import("next-sanity/visual-editing").then((m) => m.VisualEditing), { ssr: false });
const DisableDraftMode = dynamic(() => import("./DisableDraftMode").then((m) => m.DisableDraftMode), { ssr: false });

export function DraftTools() {
  return (
    <>
      <DisableDraftMode />
      <VisualEditing />
    </>
  );
}
