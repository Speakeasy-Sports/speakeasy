import { defineField, defineType } from "sanity";
import { PlayIcon } from "@sanity/icons/Play";

export const EMBED_PROVIDERS = [
  { title: "YouTube", value: "youtube" },
  { title: "Spotify", value: "spotify" },
  { title: "Apple Podcasts", value: "apple" },
  { title: "Other (podcast RSS player or embed URL)", value: "other" },
] as const;

export const heroEmbed = defineType({
  name: "heroEmbed",
  title: "Hero embed",
  type: "object",
  icon: PlayIcon,
  fields: [
    defineField({
      name: "provider",
      type: "string",
      options: { list: [...EMBED_PROVIDERS], layout: "radio" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "url",
      type: "url",
      description: "The public watch or episode URL. The site builds the player from it.",
      validation: (rule) => rule.required().uri({ scheme: ["https"] }),
    }),
    defineField({
      name: "title",
      type: "string",
      description: "Accessible title for the player, for example the episode name.",
      validation: (rule) => rule.required().max(160),
    }),
  ],
  preview: { select: { title: "title", subtitle: "provider" } },
});
