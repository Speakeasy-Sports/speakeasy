import type { Metadata } from "next";
import { InfoPageView, infoPageMetadata } from "../_views/InfoPageView";

export const revalidate = 3600;

export function generateMetadata(): Promise<Metadata> {
  return infoPageMetadata("contact");
}

export default function ContactPage() {
  return <InfoPageView slug="contact" />;
}
