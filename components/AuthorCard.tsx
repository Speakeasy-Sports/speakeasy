import Link from "next/link";
import type { AuthorRef } from "@/lib/types";
import { authorPath } from "@/lib/seo";
import { SanityImage } from "./SanityImage";

const PLATFORM_LABELS: Record<string, string> = {
  x: "X",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  threads: "Threads",
  bluesky: "Bluesky",
  website: "Website",
};

export function AuthorCard({ author }: { author: AuthorRef }) {
  if (!author.name) return null;
  const socials = (author.socialLinks ?? []).filter((s) => s.url);

  return (
    <div className="flex gap-4 font-ui">
      {author.photo?.asset && (
        <span className="h-16 w-16 shrink-0 overflow-hidden rounded-full">
          <SanityImage image={author.photo} alt={author.name} width={64} aspect={1} sizes="64px" className="h-full w-full object-cover" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-base font-semibold">
          {author.slug ? (
            <Link href={authorPath(author.slug)} className="no-underline hover:underline">
              {author.name}
            </Link>
          ) : (
            author.name
          )}
          {author.role && <span className="ml-2 font-normal text-fg-muted">{author.role}</span>}
        </p>
        {author.bio && <p className="mt-1 text-sm text-fg-muted">{author.bio}</p>}
        {socials.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-3 text-sm">
            {socials.map((s) => (
              <li key={s._key}>
                <a href={s.url ?? "#"} rel="noopener noreferrer me" target="_blank" className="text-accent">
                  {PLATFORM_LABELS[s.platform ?? ""] ?? s.platform}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
