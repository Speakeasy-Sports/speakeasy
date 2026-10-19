import { defineField } from "sanity";

// Alt text for any image field. Required whenever an image is set (AGENTS.md section 10).
export const altField = defineField({
  name: "alt",
  title: "Alt text",
  type: "string",
  description: "Describe the image for readers who cannot see it. Required.",
  validation: (rule) => rule.required().max(250),
});

// Image fields shared by hero images and body image blocks.
export const imageWithAltFields = [
  altField,
  defineField({ name: "caption", type: "string", validation: (rule) => rule.max(300) }),
  defineField({
    name: "credit",
    type: "string",
    description: 'Photographer or source, for example "Photo: Jon Smith".',
    validation: (rule) => rule.max(120),
  }),
];
