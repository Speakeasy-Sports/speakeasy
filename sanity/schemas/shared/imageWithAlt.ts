import { defineField } from "sanity";

// Image fields shared by hero images and body image blocks. Alt is required everywhere.
export const imageWithAltFields = [
  defineField({
    name: "alt",
    title: "Alt text",
    type: "string",
    description: "Describe the image for readers who cannot see it. Required.",
    validation: (rule) => rule.required().max(250),
  }),
  defineField({ name: "caption", type: "string", validation: (rule) => rule.max(300) }),
  defineField({
    name: "credit",
    type: "string",
    description: 'Photographer or source, for example "Photo: Jon Smith".',
    validation: (rule) => rule.max(120),
  }),
];
