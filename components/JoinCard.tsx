import { JoinButton } from "./JoinButton";

type Props = {
  communityName: string;
  joinUrl: string;
  schoolSlug?: string | null;
};

/** Rail promo for the Circle community. Every story on the site has a thread there, which is the honest pitch. */
export function JoinCard({ communityName, joinUrl, schoolSlug }: Props) {
  return (
    <section
      aria-labelledby="join-card-h"
      data-school={schoolSlug ?? undefined}
      className="flex flex-col gap-4 border-t-[3px] border-accent bg-bg-elev p-6"
    >
      <p className="label-caps text-accent">The Club</p>
      <h2 id="join-card-h" className="headline text-[1.625rem] leading-[1.1]">
        {communityName}
      </h2>
      <p className="font-ui text-[0.9375rem] leading-relaxed text-fg-muted">
        Free to join. Every story here gets its own thread there, with the people who watch every snap.
      </p>
      <div>
        <JoinButton href={joinUrl} location="rail">
          Join free
        </JoinButton>
      </div>
    </section>
  );
}
