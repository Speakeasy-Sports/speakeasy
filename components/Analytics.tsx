import Script from "next/script";
import { PLAUSIBLE_DOMAIN } from "@/lib/analytics/plausible";

/** Plausible, with outbound link tracking. No cookies, so no banner (AGENTS.md 7.5). */
export function Analytics() {
  if (!PLAUSIBLE_DOMAIN) return null;
  return (
    <>
      <Script
        defer
        data-domain={PLAUSIBLE_DOMAIN}
        src="https://plausible.io/js/script.outbound-links.js"
        strategy="afterInteractive"
      />
      <Script id="plausible-init" strategy="afterInteractive">
        {`window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`}
      </Script>
    </>
  );
}
