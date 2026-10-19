/** Only same-origin paths are honored. Anything that parses to another origin (including "/\evil.com") goes home. */
export function safeReturnPath(to: string | null, origin: string): string {
  if (!to || to.includes("\\")) return "/";
  let url: URL;
  try {
    url = new URL(to, origin);
  } catch {
    return "/";
  }
  if (url.origin !== origin) return "/";
  return `${url.pathname}${url.search}${url.hash}`;
}
