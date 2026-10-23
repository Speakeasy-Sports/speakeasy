"use client";

import { useId, useState } from "react";
import { track } from "@/lib/analytics/plausible";
import { closingPeriod, type SiteCopy } from "@/lib/site-copy";

type Props = {
  /** inline: end of article. band: full-width two-column, directly above the footer. page: the /newsletter page. */
  variant?: "inline" | "band" | "page";
  headline?: string | null;
  blurb?: string | null;
  /** School slug to record as interest. */
  school?: string | null;
  location?: string;
  sampleUrl?: string | null;
  /** Button, messages, and fine print from Site settings > Copy. */
  copy: SiteCopy["newsletter"];
};

type State = "idle" | "submitting" | "done" | "error";

/**
 * Posts to /api/newsletter (AGENTS.md 7.4), which submits the address to the Circle Email Hub form. The success
 * message does not promise a confirmation email: whether Circle sends one is checked with the first live signup.
 */
export function NewsletterSignup({ variant = "inline", headline, blurb, school, location = "article_end", sampleUrl, copy }: Props) {
  const id = useId();
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setState("submitting");
    setMessage(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          school: data.get("school") || undefined,
          website: data.get("website") || "", // honeypot
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage(body.error ?? null);
        throw new Error(String(res.status));
      }
      setState("done");
      track({ name: "newsletter_signup", props: { location } });
      form.reset();
    } catch {
      setState("error");
    }
  }

  const title = headline ?? "The Speakeasy newsletter";

  const form =
    state === "done" ? (
      <p className="font-ui text-base text-fg" role="status">
        {copy.success}
      </p>
    ) : (
      <form onSubmit={onSubmit} className="flex flex-col gap-3 font-ui sm:flex-row">
        <label htmlFor={`${id}-email`} className="sr-only">
          Email address
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="Email address"
          className="h-12 min-w-0 flex-1 rounded-base border border-line bg-bg px-4 text-base text-fg placeholder:text-fg-subtle focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
        />
        {school && <input type="hidden" name="school" value={school} />}
        {/* Honeypot. Hidden from people, filled by bots. */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
        <button
          type="submit"
          disabled={state === "submitting"}
          className="h-12 shrink-0 rounded-base bg-fg px-6 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {state === "submitting" ? "Signing up" : copy.button}
        </button>
      </form>
    );

  const error =
    state === "error" ? (
      <p className="font-ui text-sm text-fg-muted" role="alert">
        {message ?? "That did not go through. Try again in a moment."}
      </p>
    ) : null;

  const fine = (
    <p className="font-ui text-[0.8125rem] text-fg-subtle">
      {copy.finePrint}
      {sampleUrl && (
        <>
          {" "}
          <a href={sampleUrl} className="text-fg underline decoration-line underline-offset-4 hover:decoration-fg">
            {copy.sampleLink}
          </a>
          {closingPeriod(copy.sampleLink)}
        </>
      )}
    </p>
  );

  if (variant === "band") {
    return (
      <section aria-labelledby={`${id}-h`} data-newsletter-band className="border-t border-line bg-bg-elev">
        <div className="shell grid gap-8 py-14 md:grid-cols-12 md:items-end md:gap-10 md:py-20">
          <div className="flex flex-col gap-3 md:col-span-6">
            <p className="label-caps text-fg-muted">{copy.kicker}</p>
            <h2 id={`${id}-h`} className="headline text-[2rem] leading-[1.05] sm:text-[2.75rem] sm:tracking-[-0.025em]">
              {title}
            </h2>
            {blurb && <p className="max-w-md text-lg leading-snug text-fg-muted">{blurb}</p>}
          </div>
          <div className="flex flex-col gap-3 md:col-span-6">
            {form}
            {error}
            {fine}
          </div>
        </div>
      </section>
    );
  }

  if (variant === "page") {
    return (
      <section aria-labelledby={`${id}-h`} className="flex flex-col gap-4">
        <h2 id={`${id}-h`} className="sr-only">
          Sign up
        </h2>
        {form}
        {error}
        {fine}
      </section>
    );
  }

  return (
    <section aria-labelledby={`${id}-h`} className="flex flex-col gap-4">
      <p className="label-caps text-fg-muted">{copy.kicker}</p>
      <h2 id={`${id}-h`} className="headline text-2xl leading-tight sm:text-[1.75rem]">
        {title}
      </h2>
      {blurb && <p className="text-base leading-snug text-fg-muted">{blurb}</p>}
      {form}
      {error}
      {fine}
    </section>
  );
}
