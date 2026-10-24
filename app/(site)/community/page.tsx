import type { Metadata } from "next";
import Link from "next/link";
import { stegaClean } from "@sanity/client/stega";
import { sanityFetch } from "@/lib/sanity/fetch";
import { COMMUNITY_QUERY } from "@/lib/sanity/queries";
import { getSiteSettings } from "@/lib/sanity/loaders";
import { tags } from "@/lib/sanity/tags";
import { buildMetadata, defaultOgImage } from "@/lib/seo";
import { JoinButton } from "@/components/JoinButton";
import { SchoolTheme } from "@/components/SchoolTheme";

export const revalidate = 300;

const TITLE = "Find your college sports community.";
const INTRO = "Every story here can keep going with the people who care as much as you do. Dawg Social Club is open now, and more schools are on the way.";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildMetadata({ title: "Community", description: INTRO, path: "/community", fallbackImage: defaultOgImage(settings) });
}

/**
 * /community (docs/specs/phase-1-ux-update.md, 6.4): the clubs that are open, with a join link and a sign-in link
 * for members. The waitlist for future communities is added below these in release E.
 */
export default async function CommunityPage() {
  const clubs = await sanityFetch({ query: COMMUNITY_QUERY, tags: [tags.schools], revalidate: 300 });

  return (
    <div className="shell">
      <header className="mx-auto flex max-w-[42rem] flex-col gap-5 border-b border-line pb-10 pt-12 sm:pt-20">
        <p className="label-caps text-fg-muted">Community</p>
        <h1 className="headline text-[2.75rem] leading-[0.98] tracking-[-0.03em] sm:text-[4rem]">{TITLE}</h1>
        <p className="text-xl leading-snug text-fg-muted">{INTRO}</p>
      </header>
      <div className="mx-auto flex max-w-[42rem] flex-col gap-10 pt-10">
        {clubs.map((club) => {
          const slug = stegaClean(club.slug);
          if (!slug || !club.circleJoinUrl) return null;
          const name = club.communityName ?? club.name ?? "The Club";
          return (
            <section key={club._id} data-school={slug} aria-labelledby={`club-${slug}`} className="flex flex-col gap-4 border-t-[3px] border-accent bg-bg-elev p-6 sm:p-8">
              <SchoolTheme slug={slug} accentColor={club.accentColor} accentColorDark={club.accentColorDark} />
              <p className="label-caps text-accent">Open now</p>
              <h2 id={`club-${slug}`} className="headline text-[1.75rem] leading-[1.1]">
                {name}
              </h2>
              {club.description && <p className="font-ui text-[0.9375rem] leading-relaxed text-fg-muted">{club.description}</p>}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 font-ui">
                <JoinButton href={stegaClean(club.circleJoinUrl)} location="community_page">
                  Join {name}
                </JoinButton>
                {club.circleSignInUrl && (
                  <a href={stegaClean(club.circleSignInUrl)} className="text-sm text-fg underline decoration-line underline-offset-4 hover:decoration-fg">
                    Member sign in
                  </a>
                )}
              </div>
            </section>
          );
        })}
        <p className="border-t border-line pt-6 font-ui text-[0.9375rem] text-fg-muted">
          More communities are on the way. Want one for your school?{" "}
          <Link href="/newsletter" className="text-fg underline decoration-line underline-offset-4 hover:decoration-fg">
            Get the newsletter
          </Link>{" "}
          and you will hear first.
        </p>
      </div>
    </div>
  );
}
