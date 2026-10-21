// Write for us applications (AGENTS.md 7.9): validation and the email to the editor. Pure, unit tested.
import type { Email } from "./postmark";

export type Application = {
  name: string;
  email: string;
  cover: string;
  samples: string[];
  social: string | null;
  worth: string | null;
};

export type ParseResult = { ok: true; value: Application } | { ok: false; field: string; message: string };

export const LIMITS = { name: 120, email: 254, cover: 2000, sample: 500, social: 100, worth: 1000 } as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(raw: unknown): string {
  return typeof raw === "string" ? raw.trim() : "";
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** Checks a submitted form body. Field names match the form; messages are shown to the applicant. */
export function parseApplication(body: unknown): ParseResult {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const name = text(b.name);
  const email = text(b.email);
  const cover = text(b.cover);
  const samples = [text(b.sample1), text(b.sample2)].filter(Boolean);
  const social = text(b.social);
  const worth = text(b.worth);

  if (!name || name.length > LIMITS.name) return { ok: false, field: "name", message: "Add your name." };
  if (!EMAIL_RE.test(email) || email.length > LIMITS.email) return { ok: false, field: "email", message: "Check your email address." };
  if (!cover || cover.length > LIMITS.cover) {
    return { ok: false, field: "cover", message: `Tell us what you would cover, in under ${LIMITS.cover} characters.` };
  }
  if (samples.length === 0) return { ok: false, field: "sample1", message: "Add at least one link to your work." };
  if (samples.some((s) => s.length > LIMITS.sample || !isHttpUrl(s))) {
    return { ok: false, field: "sample1", message: "Sample links need to be full web addresses, starting with https://." };
  }
  if (social.length > LIMITS.social) return { ok: false, field: "social", message: "That social handle is too long." };
  if (worth.length > LIMITS.worth) return { ok: false, field: "worth", message: `Keep this under ${LIMITS.worth} characters.` };
  if (b.adult !== true) return { ok: false, field: "adult", message: "Contributors need to be 18 or older." };

  return { ok: true, value: { name, email, cover, samples, social: social || null, worth: worth || null } };
}

/** The editor's copy. Reply-To is the applicant, so answering the email answers them. */
export function buildApplicationEmail(to: string, a: Application): Email {
  const lines = [
    `${a.name} applied to write for Speakeasy.`,
    "",
    `Email: ${a.email}`,
    ...(a.social ? [`Social: ${a.social}`] : []),
    "",
    "What they would cover:",
    a.cover,
    "",
    "Samples:",
    ...a.samples.map((s) => `- ${s}`),
    ...(a.worth ? ["", "What would make it worth their time:", a.worth] : []),
    "",
    "They confirmed they are 18 or older. Reply to this email to answer them.",
  ];
  return { to, replyTo: a.email, subject: `Write for us: ${a.name}`, text: lines.join("\n") };
}
