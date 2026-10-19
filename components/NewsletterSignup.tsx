"use client";

import { useId, useState } from "react";
import { track } from "@/lib/analytics/plausible";

type Props = {
  variant?: "inline" | "page";
  headline?: string | null;
  blurb?: string | null;
  /** School slug to record as interest. */
  school?: string | null;
  location?: string;
};

type State = "idle" | "submitting" | "done" | "error";

/**
 * Posts to /api/newsletter (handler lands in week 2). Shows a "check your inbox" state on success,
 * since Circle handles double opt-in.
 */
export function NewsletterSignup({ variant = "inline", headline, blurb, school, location = "article_end" }: Props) {
  const id = useId();
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setState("submitting");
    setError(null);
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
      if (!res.ok) throw new Error(`Signup failed (${res.status})`);
      setState("done");
      track({ name: "newsletter_signup", props: { location } });
      form.reset();
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const isPage = variant === "page";

  return (
    <section
      aria-labelledby={`${id}-h`}
      className={`rounded-base border border-line bg-bg-elev font-ui ${isPage ? "p-8" : "p-5"}`}
    >
      <h2 id={`${id}-h`} className={`font-display font-semibold ${isPage ? "text-3xl" : "text-xl"}`}>
        {headline ?? "Get the newsletter"}
      </h2>
      {blurb && <p className="mt-1 text-sm text-fg-muted">{blurb}</p>}

      {state === "done" ? (
        <p className="mt-4 text-base" role="status">
          Check your inbox to confirm your subscription.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex grow flex-col gap-1 text-sm">
            <span>Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              className="rounded-base border border-line bg-bg px-3 py-2 text-base text-fg"
            />
          </label>
          {school && <input type="hidden" name="school" value={school} />}
          {/* Honeypot. Hidden from people, filled by bots. */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
          <button
            type="submit"
            disabled={state === "submitting"}
            className="rounded-base bg-fg px-4 py-2 text-sm font-semibold text-bg disabled:opacity-60"
          >
            {state === "submitting" ? "Sending" : "Subscribe"}
          </button>
        </form>
      )}
      {state === "error" && (
        <p className="mt-2 text-sm text-fg-muted" role="alert">
          {error}. Try again in a moment.
        </p>
      )}
    </section>
  );
}
