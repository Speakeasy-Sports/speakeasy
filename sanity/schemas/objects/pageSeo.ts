import { defineField, defineType } from "sanity";
import { PAGE_SEO_PAGES } from "../../../lib/page-seo";

const seoFields = [
  defineField({
    name: "title",
    type: "string",
    description: "Search and share title. Leave empty for the default.",
    validation: (rule) => rule.max(70),
  }),
  defineField({
    name: "description",
    type: "text",
    rows: 2,
    description: "Search and share description, about 150 characters. Leave empty for the default.",
    validation: (rule) => rule.max(160),
  }),
];

// SEO for the index pages that have no document of their own (lib/page-seo.ts).
export const pageSeo = defineType({
  name: "pageSeo",
  title: "Page SEO",
  type: "object",
  fields: PAGE_SEO_PAGES.map((p) =>
    defineField({
      name: p.name,
      title: p.title,
      type: "object",
      options: { collapsible: true, collapsed: true },
      fields: seoFields,
    }),
  ),
});
