import { defineField, defineType } from "sanity";
import { ClockIcon } from "@sanity/icons/Clock";

export const episodeTimestamp = defineType({
  name: "episodeTimestamp",
  title: "Timestamp",
  type: "object",
  icon: ClockIcon,
  fields: [
    defineField({
      name: "time",
      type: "string",
      description: "mm:ss or h:mm:ss",
      validation: (rule) =>
        rule
          .required()
          .regex(/^(\d{1,2}:)?\d{1,2}:\d{2}$/, { name: "timestamp", invert: false })
          .error("Use mm:ss or h:mm:ss"),
    }),
    defineField({ name: "label", type: "string", validation: (rule) => rule.required().max(120) }),
  ],
  preview: { select: { title: "label", subtitle: "time" } },
});
