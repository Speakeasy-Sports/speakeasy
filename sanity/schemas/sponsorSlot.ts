import { defineArrayMember, defineField, defineType } from "sanity";
import { BillIcon } from "@sanity/icons/Bill";

export const SPONSOR_PLACEMENTS = [
  { title: "Article, below hero", value: "articleBelowHero" },
  { title: "Newsletter", value: "newsletter" },
] as const;

export const sponsorSlot = defineType({
  name: "sponsorSlot",
  title: "Sponsor slot",
  type: "document",
  icon: BillIcon,
  fields: [
    defineField({ name: "name", type: "string", description: "Internal name.", validation: (rule) => rule.required() }),
    defineField({
      name: "placement",
      type: "string",
      options: { list: [...SPONSOR_PLACEMENTS], layout: "radio" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "active",
      type: "boolean",
      initialValue: false,
      description: "Hidden until sold. Nothing renders while this is off.",
    }),
    defineField({ name: "sponsorName", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "logo",
      type: "image",
      fields: [defineField({ name: "alt", type: "string", validation: (rule) => rule.required() })],
    }),
    defineField({ name: "headline", type: "string", validation: (rule) => rule.max(120) }),
    defineField({ name: "url", type: "url", validation: (rule) => rule.required().uri({ scheme: ["https"] }) }),
    defineField({ name: "label", type: "string", initialValue: "Presented by" }),
    defineField({
      name: "schools",
      type: "array",
      description: "Leave empty to show on every school.",
      of: [defineArrayMember({ type: "reference", to: [{ type: "school" }] })],
    }),
    defineField({ name: "startDate", type: "datetime" }),
    defineField({
      name: "endDate",
      type: "datetime",
      validation: (rule) =>
        rule.custom((endDate, context) => {
          const startDate = context.document?.startDate as string | undefined;
          if (startDate && endDate && new Date(endDate) < new Date(startDate)) return "End date must be after start date";
          return true;
        }),
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "placement", media: "logo", active: "active" },
    prepare: ({ title, subtitle, media, active }) => ({
      title: `${active ? "" : "(inactive) "}${title}`,
      subtitle,
      media,
    }),
  },
});
