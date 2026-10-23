import Link from "next/link";
import { isExternalHref } from "@/lib/nav-links";

/** A link from an editable menu: site paths use next/link, https URLs open in a new tab, mailto opens the mail app. */
export function MenuLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  if (!isExternalHref(href)) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  const newTab = href.startsWith("https:");
  return (
    <a href={href} className={className} {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
    </a>
  );
}
