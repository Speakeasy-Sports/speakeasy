import type { Metadata, Viewport } from "next";
import { draftMode } from "next/headers";
import { display, serif, serifItalic } from "@/lib/fonts";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import { Analytics } from "@/components/Analytics";
import { DraftTools } from "@/components/DraftTools";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfbf8" },
    { media: "(prefers-color-scheme: dark)", color: "#121210" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const isDraft = (await draftMode()).isEnabled;
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${serifItalic.variable}`}>
      <body className="min-h-dvh bg-bg text-fg antialiased">
        {children}
        {isDraft && <DraftTools />}
        <Analytics />
      </body>
    </html>
  );
}
