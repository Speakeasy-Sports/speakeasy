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
  fields: [
    defineField({ name: "siteName", type: "string", initialValue: "Speakeasy Sports", validation: (rule) => rule.required() }),
    defineField({ name: "tagline", type: "string", validation: (rule) => rule.max(120) }),
    defineField({
      name: "defaultOgImage",
      type: "image",
      description: "1200x630. Used when a page has no image of its own.",
      fields: [altField],
    }),
    defineField({
      name: "socialLinks",
      type: "array",
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
    defineField({ name: "footerText", type: "text", rows: 2 }),
    defineField({
      name: "joinUrl",
      title: "Default join URL",
      type: "url",
      description: "Circle join link used when no school is in context.",
      validation: (rule) => rule.uri({ scheme: ["https"] }),
    }),
    defineField({ name: "newsletterHeadline", type: "string", validation: (rule) => rule.max(90) }),
    defineField({ name: "newsletterBlurb", type: "text", rows: 2, validation: (rule) => rule.max(300) }),
    defineField({
      name: "newsletterSampleUrl",
      title: "Sample issue URL",
      type: "url",
      description: "A past issue readers can open from the newsletter page.",
      validation: (rule) => rule.uri({ scheme: ["https"] }),
    }),
    defineField({
      name: "navSchools",
      type: "array",
      description: "Schools shown in the header, in order.",
      of: [defineArrayMember({ type: "reference", to: [{ type: "school" }] })],
      validation: (rule) => rule.unique(),
    }),
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
});
