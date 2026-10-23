import { defineArrayMember, defineField, defineType } from "sanity";
import { LinkIcon } from "@sanity/icons/Link";
import { isValidHref } from "../../../lib/nav-links";

// One menu link. A site path ("/newsletter") opens in the same tab; a full https URL opens in a new one.
export const navLink = defineType({
  name: "navLink",
  title: "Link",
  type: "object",
  icon: LinkIcon,
  fields: [
    defineField({ name: "label", type: "string", validation: (rule) => rule.required().max(40) }),
    defineField({
      name: "href",
      title: "Link to",
      type: "string",
      description: 'A site path like "/newsletter", or a full URL starting with https://.',
      validation: (rule) =>
        rule.required().custom((href) => !href || isValidHref(href.trim()) || 'Use a site path like "/about" or a full https:// URL'),
    }),
  ],
  preview: { select: { title: "label", subtitle: "href" } },
});

export const footerColumn = defineType({
  name: "footerColumn",
  title: "Footer column",
  type: "object",
  fields: [
    defineField({ name: "title", type: "string", validation: (rule) => rule.required().max(30) }),
    defineField({
      name: "links",
      type: "array",
      of: [defineArrayMember({ type: "navLink" })],
      validation: (rule) => rule.required().min(1).max(8),
    }),
  ],
  preview: {
    select: { title: "title", links: "links" },
    prepare: ({ title, links }: { title?: string; links?: unknown[] }) => ({
      title,
      subtitle: `${links?.length ?? 0} links`,
    }),
  },
});
