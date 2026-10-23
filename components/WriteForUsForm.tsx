"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { SiteCopy } from "@/lib/site-copy";

type State = { kind: "idle" | "submitting" | "done" } | { kind: "error"; message: string; field?: string };

const input =
  "h-12 min-w-0 rounded-base border border-line bg-bg px-4 text-base text-fg placeholder:text-fg-subtle focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";
const area =
  "min-w-0 rounded-base border border-line bg-bg px-4 py-3 text-base text-fg placeholder:text-fg-subtle focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";
const label = "text-sm font-semibold text-fg";
const optional = <span className="font-normal text-fg-subtle">(optional)</span>;

/** The Write for us application (AGENTS.md 7.9). Posts to /api/write-for-us, which emails the editor. */
export function WriteForUsForm({ copy }: { copy: SiteCopy["writeForUs"] }) {
  const id = useId();
  const [state, setState] = useState<State>({ kind: "idle" });
  const startedAt = useRef(0);
  const status = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (state.kind === "done" || state.kind === "error") status.current?.focus();
  }, [state.kind]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setState({ kind: "submitting" });
    try {
      const res = await fetch("/api/write-for-us", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          cover: data.get("cover"),
          sample1: data.get("sample1"),
          sample2: data.get("sample2"),
          social: data.get("social"),
          worth: data.get("worth"),
          adult: data.get("adult") === "on",
          website: data.get("website") || "", // honeypot
          elapsed: Date.now() - startedAt.current,
        }),
      });
      if (res.ok) return setState({ kind: "done" });
      const body = (await res.json().catch(() => ({}))) as { error?: string; field?: string };
      setState({ kind: "error", message: body.error ?? "That did not go through. Try again in a moment.", field: body.field });
    } catch {
      setState({ kind: "error", message: "That did not go through. Try again in a moment." });
    }
  }

  if (state.kind === "done") {
    return (
      <div ref={status} tabIndex={-1} role="status" className="flex flex-col gap-2 font-ui outline-none">
        <p className="text-base font-semibold text-fg">{copy.successTitle}</p>
        <p className="text-base text-fg-muted">{copy.responseTime}</p>
      </div>
    );
  }

  const invalid = (field: string) => (state.kind === "error" && state.field === field ? true : undefined);
  const errId = `${id}-error`;
  const described = (field: string) => (invalid(field) ? errId : undefined);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 font-ui">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-name`} className={label}>
            Name
          </label>
          <input id={`${id}-name`} name="name" required maxLength={120} autoComplete="name" aria-invalid={invalid("name")} aria-describedby={described("name")} className={input} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-email`} className={label}>
            Email
          </label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            aria-invalid={invalid("email")}
            aria-describedby={described("email")}
            className={input}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-cover`} className={label}>
          What would you cover?
        </label>
        <textarea
          id={`${id}-cover`}
          name="cover"
          rows={4}
          required
          maxLength={2000}
          placeholder="Beat, angle, and how often you could publish"
          aria-invalid={invalid("cover")}
          aria-describedby={described("cover")}
          className={area}
        />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className={`${label} mb-2`}>Two samples of your work</legend>
        <input
          name="sample1"
          type="url"
          required
          maxLength={500}
          aria-label="First sample"
          placeholder="Link to a story, episode, or video"
          aria-invalid={invalid("sample1")}
          aria-describedby={described("sample1")}
          className={input}
        />
        <input name="sample2" type="url" maxLength={500} aria-label="Second sample" placeholder="Link to a second sample" className={input} />
      </fieldset>
      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-social`} className={label}>
          Social handle {optional}
        </label>
        <input id={`${id}-social`} name="social" maxLength={100} placeholder="@yourname" className={input} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-worth`} className={label}>
          What would make it worth your time? {optional}
        </label>
        <textarea
          id={`${id}-worth`}
          name="worth"
          rows={3}
          maxLength={1000}
          placeholder="Pay, perks, exposure, a seat in the press box. Be honest."
          className={area}
        />
      </div>
      <label className="flex items-start gap-3 text-sm text-fg">
        <input name="adult" type="checkbox" required aria-invalid={invalid("adult")} aria-describedby={described("adult")} className="mt-1 h-4 w-4 shrink-0 accent-[var(--fg)]" />
        <span>I am 18 or older.</span>
      </label>
      {/* Honeypot. Hidden from people, filled by bots. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <div className="flex flex-col gap-3">
        {state.kind === "error" && (
          <div ref={status} id={errId} tabIndex={-1} role="alert" className="text-sm text-fg outline-none">
            {state.message}
          </div>
        )}
        <div>
          <button
            type="submit"
            disabled={state.kind === "submitting"}
            className="h-12 shrink-0 rounded-base bg-fg px-6 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {state.kind === "submitting" ? "Sending" : copy.button}
          </button>
        </div>
        <p className="text-[0.8125rem] text-fg-subtle">{copy.responseTime}</p>
      </div>
    </form>
  );
}
