import { defineArrayMember, defineField, defineType } from "sanity";

// Article body: paragraphs, h2, h3, blockquote, bullet and numbered lists, bold, italic, link,
// plus the custom blocks in ../blocks. sponsorSlotRef is intentionally left out of v1 bodies.
export const body = defineType({
  name: "body",
  title: "Body",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Paragraph", value: "normal" },
        { title: "Heading", value: "h2" },
        { title: "Subheading", value: "h3" },
        { title: "Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bullets", value: "bullet" },
        { title: "Numbered", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Bold", value: "strong" },
          { title: "Italic", value: "em" },
        ],
        annotations: [
          defineArrayMember({
            name: "link",
            type: "object",
            title: "Link",
            fields: [
              defineField({
                name: "href",
                title: "URL",
                type: "url",
                validation: (rule) =>
                  rule.required().uri({ scheme: ["http", "https", "mailto"], allowRelative: true }),
              }),
            ],
          }),
        ],
      },
    }),
    defineArrayMember({ type: "imageBlock" }),
    defineArrayMember({ type: "videoEmbed" }),
    defineArrayMember({ type: "podcastEmbed" }),
    defineArrayMember({ type: "socialEmbed" }),
    defineArrayMember({ type: "pullQuote" }),
    defineArrayMember({ type: "callout" }),
  ],
});
