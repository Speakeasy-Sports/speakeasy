import "server-only";

// Postmark transactional email (AGENTS.md 7.6). Stream speakeasy-transactional, sending domain mail.speakeasysports.com.
const API = "https://api.postmarkapp.com/email";
const STREAM = "speakeasy-transactional";

export type Email = { to: string; subject: string; text: string; replyTo?: string };

export function postmarkConfigured(): boolean {
  return !!process.env.POSTMARK_SERVER_TOKEN && !!process.env.POSTMARK_FROM;
}

export async function sendEmail(email: Email): Promise<void> {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": process.env.POSTMARK_SERVER_TOKEN!,
    },
    body: JSON.stringify({
      From: process.env.POSTMARK_FROM,
      To: email.to,
      ReplyTo: email.replyTo,
      Subject: email.subject,
      TextBody: email.text,
      MessageStream: STREAM,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Postmark ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
