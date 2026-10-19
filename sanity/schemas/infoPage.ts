import { defineField, defineType } from "sanity";
import { DocumentIcon } from "@sanity/icons/Document";

export const INFO_PAGE_SLUGS = [
  { title: "About", value: "about" },
  { title: "Contact", value: "contact" },
  { title: "Terms of use", value: "terms" },
  { title: "Privacy", value: "privacy" },
] as const;

// The four standing pages linked from the footer. One document each; the site has a route per slug.
export const infoPage = defineType({
  name: "infoPage",
  title: "Page",
  type: "document",
  icon: DocumentIcon,
  fields: [
    defineField({ name: "title", type: "string", validation: (rule) => rule.required().max(90) }),
    defineField({
      name: "slug",
      type: "slug",
      description: "Which footer page this is.",
      options: { source: "title" },
      validation: (rule) =>
        rule.required().custom((slug) => {
          const allowed: readonly string[] = INFO_PAGE_SLUGS.map((s) => s.value);
          return !slug?.current || allowed.includes(slug.current) || `Use one of: ${allowed.join(", ")}`;
        }),
    }),
    defineField({
      name: "intro",
      type: "text",
      rows: 2,
      description: "One or two sentences under the title. Also the page's search description.",
      validation: (rule) => rule.max(200),
    }),
    defineField({ name: "body", type: "body" }),
  ],
  preview: { select: { title: "title", subtitle: "slug.current" } },
});
