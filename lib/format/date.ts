const DAY_MS = 24 * 60 * 60 * 1000;

const longDate = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "America/New_York",
});

/**
 * Byline timestamp (AGENTS.md section 6): relative under 24 hours, then "October 19, 2026".
 */
export function formatPublished(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diff = now.getTime() - date.getTime();
  if (diff >= 0 && diff < DAY_MS) {
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }
  return longDate.format(date);
}

export function formatLongDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : longDate.format(date);
}

/** True when updatedAt is meaningfully later than publishedAt (more than one minute). */
export function isUpdated(publishedAt?: string | null, updatedAt?: string | null): boolean {
  if (!publishedAt || !updatedAt) return false;
  return new Date(updatedAt).getTime() - new Date(publishedAt).getTime() > 60_000;
}
