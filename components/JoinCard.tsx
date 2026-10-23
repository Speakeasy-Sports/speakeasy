import type { SiteCopy } from "@/lib/site-copy";
import { JoinButton } from "./JoinButton";

type Props = {
  /** The card headline: the school's community name on a school front, the home headline from copy on home. */
  communityName: string;
  joinUrl: string;
  schoolSlug?: string | null;
  copy: SiteCopy["join"];
};

/** Rail promo for the Circle community. Every story on the site has a thread there, which is the honest pitch. */
export function JoinCard({ communityName, joinUrl, schoolSlug, copy }: Props) {
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
    </section>
  );
}
