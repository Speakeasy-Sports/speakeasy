import type { ConditionalPropertyCallback, CurrentUser } from "sanity";

// Editors and Administrators run the desk; Contributors write and submit for review (AGENTS.md section 5).
const EDITOR_ROLES = new Set(["administrator", "editor"]);

export function canPublish(user: Pick<CurrentUser, "roles"> | null | undefined): boolean {
  return user?.roles.some((r) => EDITOR_ROLES.has(r.name)) ?? false;
}

/**
 * Hides a field or tab from Contributors so the article form stays short on a phone (design sweep S1). Hidden fields
 * keep their values; editors see everything.
 */
export const editorsOnly: ConditionalPropertyCallback = ({ currentUser }) => !canPublish(currentUser);
