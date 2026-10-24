import Link from "next/link";
import type { SiteCopy } from "@/lib/site-copy";
import { JoinButton } from "./JoinButton";

type Props = {
  /** The card headline: the school's community name on a school front, the home headline from copy on home. */
  communityName: string;
  joinUrl: string;
  schoolSlug?: string | null;
  copy: SiteCopy["join"];
  /** On home: a quiet link to /community for readers whose school has no club yet. */
  findCommunity?: boolean;
};

/** Rail promo for the Circle community. Every story on the site has a thread there, which is the honest pitch. */
export function JoinCard({ communityName, joinUrl, schoolSlug, copy, findCommunity }: Props) {
  return (
    <section
      aria-labelledby="join-card-h"
      data-school={schoolSlug ?? undefined}
      className="flex flex-col gap-4 border-t-[3px] border-accent bg-bg-elev p-6"
    >
      <p className="label-caps text-accent">{copy.cardKicker}</p>
      <h2 id="join-card-h" className="headline text-[1.625rem] leading-[1.1]">
        {communityName}
      </h2>
      <p className="font-ui text-[0.9375rem] leading-relaxed text-fg-muted">
        {copy.cardBody}
      </p>
      <div>
        <JoinButton href={joinUrl} location="rail">
          {copy.cardButton}
        </JoinButton>
      </div>
      {findCommunity && (
        <p className="font-ui text-sm text-fg-muted">
          Looking for another school?{" "}
          <Link href="/community" className="text-fg underline decoration-line underline-offset-4 hover:decoration-fg">
            Find your community
          </Link>
        </p>
      )}
    </section>
  );
}
