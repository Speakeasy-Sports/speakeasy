import { defineArrayMember, defineField, defineType } from "sanity";
import { CogIcon } from "@sanity/icons/Cog";
import { SOCIAL_PLATFORMS } from "./author";
import { altField } from "./shared/imageWithAlt";

export const SITE_SETTINGS_ID = "siteSettings";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  icon: CogIcon,
  groups: [
    { name: "general", title: "General", default: true },
    { name: "navigation", title: "Navigation" },
    { name: "newsletter", title: "Newsletter" },
    { name: "copy", title: "Copy" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "siteName",
      type: "string",
      group: "general",
      initialValue: "Speakeasy Sports",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "tagline", type: "string", group: "general", validation: (rule) => rule.max(120) }),
    defineField({
      name: "joinUrl",
      title: "Default join URL",
      type: "url",
      group: "general",
      description: "Circle join link used when no school is in context.",
      validation: (rule) => rule.uri({ scheme: ["https"] }),
    }),
    defineField({
      name: "footerText",
      type: "text",
      rows: 2,
      group: "general",
      description: "Fine print at the bottom of every page.",
    }),

    defineField({
      name: "navSchools",
      type: "array",
      group: "navigation",
      description: "Schools shown in the header and footer, in order.",
      of: [defineArrayMember({ type: "reference", to: [{ type: "school" }] })],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: "menuLinks",
      title: "Phone menu links",
      type: "array",
      group: "navigation",
      description: "Shown in the phone menu after the sections. Leave empty for Search and Newsletter.",
      of: [defineArrayMember({ type: "navLink" })],
      validation: (rule) => rule.max(6),
    }),
    defineField({
      name: "footerColumns",
      type: "array",
      group: "navigation",
      description:
        "Link columns in the footer, between Sections and Follow. Leave empty for one Speakeasy column (About, Contact, Newsletter, Write for us, RSS).",
      of: [defineArrayMember({ type: "footerColumn" })],
      validation: (rule) => rule.max(2),
    }),
    defineField({
      name: "legalLinks",
      type: "array",
      group: "navigation",
      description: "Small links at the very bottom. Leave empty for Terms and Privacy.",
      of: [defineArrayMember({ type: "navLink" })],
      validation: (rule) => rule.max(4),
    }),
    defineField({
      name: "socialLinks",
      type: "array",
      group: "navigation",
      description: "The footer's Follow column.",
      of: [
        defineArrayMember({
          type: "object",
          name: "socialLink",
          fields: [
            defineField({ name: "platform", type: "string", options: { list: [...SOCIAL_PLATFORMS] } }),
            defineField({ name: "url", type: "url", validation: (rule) => rule.uri({ scheme: ["https"] }) }),
          ],
          preview: { select: { title: "platform", subtitle: "url" } },
        }),
      ],
    }),

    defineField({
      name: "newsletterHeadline",
      type: "string",
      group: "newsletter",
      placeholder: "The Speakeasy newsletter",
      validation: (rule) => rule.max(90),
    }),
    defineField({ name: "newsletterBlurb", type: "text", rows: 2, group: "newsletter", validation: (rule) => rule.max(300) }),
    defineField({
      name: "newsletterSampleUrl",
      title: "Sample issue URL",
      type: "url",
      group: "newsletter",
      description: "A past issue readers can open from the newsletter page.",
      validation: (rule) => rule.uri({ scheme: ["https"] }),
    }),

    defineField({
      name: "copy",
      type: "siteCopy",
      group: "copy",
      description: "Buttons, labels, and messages across the site. Every field shows the current text until you change it.",
    }),

    defineField({
      name: "defaultOgImage",
      type: "image",
      group: "seo",
      description: "1200x630. Used when a page has no image of its own.",
      fields: [altField],
    }),
    defineField({
      name: "pageSeo",
      title: "Index pages",
      type: "pageSeo",
      group: "seo",
      description: "Search titles and descriptions for pages without a document of their own.",
    }),
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
});
