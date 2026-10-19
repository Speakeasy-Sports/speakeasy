import type { CustomValidator } from "sanity";

export const hexColor: CustomValidator<string | undefined> = (value) => {
  if (!value) return true;
  return /^#[0-9a-fA-F]{6}$/.test(value) || "Use a six-digit hex color like #BA0C2F";
};

export const slugFormat: CustomValidator<{ current?: string } | undefined> = (slug) => {
  if (!slug?.current) return "Required";
  if (!/^[a-z0-9-]+$/.test(slug.current)) return "Lowercase letters, numbers, and hyphens only";
  return true;
};
