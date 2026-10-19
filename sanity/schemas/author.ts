import { defineArrayMember, defineField, defineType } from "sanity";
import { UserIcon } from "@sanity/icons/User";
import { slugFormat } from "./shared/validation";

export const SOCIAL_PLATFORMS = [
  { title: "X", value: "x" },
  { title: "Instagram", value: "instagram" },
  { title: "TikTok", value: "tiktok" },
  { title: "YouTube", value: "youtube" },
  { title: "Threads", value: "threads" },
  { title: "Bluesky", value: "bluesky" },
  { title: "Website", value: "website" },
] as const;

export const author = defineType({
  name: "author",
  title: "Author",
  type: "document",
  icon: UserIcon,
  fields: [
    defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name", maxLength: 60 },
      validation: (rule) => rule.required().custom(slugFormat),
    }),
    defineField({
      name: "photo",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: "role",
      type: "string",
      description: 'For example "Columnist" or "Contributor".',
    }),
    defineField({
      name: "bio",
      type: "text",
      rows: 3,
      description: "Two sentences at most. Shown at the end of articles.",
      validation: (rule) => rule.max(400),
    }),
    defineField({
      name: "socialLinks",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "socialLink",
          fields: [
            defineField({
              name: "platform",
              type: "string",
              options: { list: [...SOCIAL_PLATFORMS] },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "url",
              type: "url",
              validation: (rule) => rule.required().uri({ scheme: ["https"] }),
            }),
          ],
          preview: { select: { title: "platform", subtitle: "url" } },
        }),
      ],
    }),
    defineField({
      name: "schools",
      type: "array",
      description: "Schools this author covers. Optional.",
      of: [defineArrayMember({ type: "reference", to: [{ type: "school" }] })],
    }),
  ],
  preview: { select: { title: "name", subtitle: "role", media: "photo" } },
});
