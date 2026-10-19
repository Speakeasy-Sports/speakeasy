import { Studio } from "@/components/Studio";

// Sanity Studio at /studio (AGENTS.md section 2). Static shell; everything runs in the browser.
export const dynamic = "force-static";

export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  return <Studio />;
}
