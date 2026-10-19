const CIRCLE_BASE_URL = process.env.CIRCLE_BASE_URL ?? "https://club.speakeasysports.com";

/** Join link: the school's own, then the site default, then the community root. */
export function joinUrlFor(
  school?: { circleJoinUrl?: string | null } | null,
  settings?: { joinUrl?: string | null } | null,
): string {
  return school?.circleJoinUrl || settings?.joinUrl || CIRCLE_BASE_URL;
}
