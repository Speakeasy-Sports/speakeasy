// Public Sanity config. Safe to import from client components. Tokens live in lib/sanity/token.ts (server only).
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
export const apiVersion = "2026-10-01";
export const studioUrl = "/studio";

export function assertSanityEnv(): void {
  if (!projectId) {
    throw new Error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID. Copy .env.example to .env.local and fill it in.");
  }
}
