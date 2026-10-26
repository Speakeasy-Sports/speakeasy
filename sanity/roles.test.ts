import { describe, expect, it } from "vitest";
import type { ConditionalPropertyCallbackContext } from "sanity";
import { canPublish, editorsOnly } from "./roles";

const user = (...names: string[]) => ({ roles: names.map((name) => ({ name, title: name })) });
const ctx = (currentUser: unknown) => ({ currentUser }) as unknown as ConditionalPropertyCallbackContext;

describe("roles", () => {
  it("lets editors and administrators publish, not contributors", () => {
    expect(canPublish(user("editor"))).toBe(true);
    expect(canPublish(user("administrator"))).toBe(true);
    expect(canPublish(user("contributor"))).toBe(false);
    expect(canPublish(null)).toBe(false);
  });

  it("hides editor-only fields from contributors only", () => {
    expect(editorsOnly(ctx(user("contributor")))).toBe(true);
    expect(editorsOnly(ctx(user("editor")))).toBe(false);
  });
});
