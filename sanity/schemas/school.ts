import { defineArrayMember, defineField, defineType } from "sanity";
import { HomeIcon } from "@sanity/icons/Home";
import { isReservedSlug } from "../../lib/reserved-slugs";
import { contrast, DARK_BG, isHex, LIGHT_BG } from "../../lib/color";
import { hexColor } from "./shared/validation";

export const school = defineType({
  name: "school",
  title: "School",
  type: "document",
  icon: HomeIcon,
  groups: [
    { name: "identity", title: "Identity", default: true },
    { name: "community", title: "Community" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "name",
      type: "string",
      group: "identity",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "identity",
      description: "Used as the section path, for example /georgia.",
      options: { source: "shortName", maxLength: 40 },
      validation: (rule) =>
        rule.required().custom((slug) => {
          if (!slug?.current) return "Required";
          if (!/^[a-z0-9-]+$/.test(slug.current)) return "Lowercase letters, numbers, and hyphens only";
          if (isReservedSlug(slug.current)) return `"${slug.current}" is a reserved path`;
          return true;
        }),
    }),
    defineField({
      name: "shortName",
      type: "string",
      group: "identity",
      description: 'Short label used in bylines and cards, for example "Georgia".',
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "mascot", type: "string", group: "identity" }),
    defineField({
      name: "accentColor",
      type: "string",
      group: "identity",
      description: "Hex color, light mode. Must pass 4.5:1 on the warm white background (#FCFBF8).",
      validation: (rule) =>
        rule
          .required()
          .custom(hexColor)
          .custom((value) => {
            if (!isHex(value)) return true;
            const ratio = contrast(value, LIGHT_BG);
            return ratio >= 4.5 || `Only ${ratio.toFixed(1)}:1 on the light background. Pick a darker shade (4.5:1 needed).`;
          }),
    }),
    defineField({
      name: "accentColorDark",
      type: "string",
      group: "identity",
      description:
        "Hex color for dark mode. Must pass 4.5:1 on #121210. If empty, the site lightens the light color until it passes.",
      validation: (rule) =>
        rule.custom(hexColor).custom((value) => {
          if (!isHex(value)) return true;
          const ratio = contrast(value, DARK_BG);
          return ratio >= 4.5 || `Only ${ratio.toFixed(1)}:1 on the dark background. Pick a lighter shade (4.5:1 needed).`;
        }),
    }),
    defineField({ name: "logo", type: "image", group: "identity", options: { hotspot: true } }),
    defineField({ name: "heroImage", type: "image", group: "identity", options: { hotspot: true } }),
    defineField({ name: "description", type: "text", rows: 3, group: "identity" }),
    defineField({
      name: "order",
      type: "number",
      group: "identity",
      description: "Sort order in navigation and lists. Lower comes first.",
      initialValue: 10,
    }),

    defineField({
      name: "navTags",
      title: "Section tags",
      type: "array",
      group: "identity",
      description: "Tags shown in the section sub-nav after Latest, Podcasts, and Videos. Up to six, in this order.",
      of: [defineArrayMember({ type: "reference", to: [{ type: "tag" }] })],
      validation: (rule) => rule.max(6).unique(),
    }),
    defineField({
      name: "communityName",
      type: "string",
      group: "community",
      description: 'For example "Dawg Social Club".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "circleSpaceId",
      type: "string",
      group: "community",
      description: "The Circle space that receives auto-posts for this school.",
    }),
    defineField({
      name: "circleJoinUrl",
      type: "url",
      group: "community",
      validation: (rule) => rule.uri({ scheme: ["https"] }),
    }),

    defineField({ name: "seoTitle", type: "string", group: "seo", validation: (rule) => rule.max(70) }),
    defineField({ name: "seoDescription", type: "text", rows: 2, group: "seo", validation: (rule) => rule.max(160) }),
  ],
  orderings: [{ title: "Order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "name", subtitle: "communityName", media: "logo" },
  },
});
