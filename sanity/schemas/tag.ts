import { defineField, defineType } from "sanity";
import { TagIcon } from "@sanity/icons/Tag";
import { slugFormat } from "./shared/validation";

export const tag = defineType({
  name: "tag",
  title: "Tag",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name", maxLength: 60 },
      validation: (rule) => rule.required().custom(slugFormat),
    }),
    defineField({ name: "description", type: "text", rows: 2, validation: (rule) => rule.max(300) }),
  ],
  preview: { select: { title: "name", subtitle: "description" } },
});
