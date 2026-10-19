import { defineField, defineType } from "sanity";
import { ImageIcon } from "@sanity/icons/Image";
import { PlayIcon } from "@sanity/icons/Play";
import { MicrophoneIcon } from "@sanity/icons/Microphone";
import { ShareIcon } from "@sanity/icons/Share";
import { DoubleQuoteIcon } from "@sanity/icons/DoubleQuote";
import { InfoOutlineIcon } from "@sanity/icons/InfoOutline";
import { BillIcon } from "@sanity/icons/Bill";
import { imageWithAltFields } from "../shared/imageWithAlt";

// Custom Portable Text blocks allowed in article bodies (AGENTS.md section 5).

export const imageBlock = defineType({
  name: "imageBlock",
  title: "Image",
  type: "image",
  icon: ImageIcon,
  options: { hotspot: true },
  fields: imageWithAltFields,
  preview: { select: { title: "caption", subtitle: "alt", media: "asset" } },
});

export const videoEmbed = defineType({
  name: "videoEmbed",
  title: "Video",
  type: "object",
  icon: PlayIcon,
  fields: [
    defineField({
      name: "url",
      title: "YouTube URL",
      type: "url",
      validation: (rule) =>
        rule
          .required()
          .uri({ scheme: ["https"] })
          .custom((url) =>
            !url || /(youtube\.com|youtu\.be)\//.test(url) ? true : "Only YouTube URLs are supported in v1",
          ),
    }),
    defineField({ name: "title", type: "string", description: "Accessible title for the player." }),
  ],
  preview: {
    select: { title: "title", subtitle: "url" },
    prepare: ({ title, subtitle }) => ({ title: title || "Video", subtitle }),
  },
});

export const podcastEmbed = defineType({
  name: "podcastEmbed",
  title: "Podcast",
  type: "object",
  icon: MicrophoneIcon,
  fields: [
    defineField({
      name: "provider",
      type: "string",
      options: {
        list: [
          { title: "Spotify", value: "spotify" },
          { title: "Apple Podcasts", value: "apple" },
          { title: "Other embed URL", value: "other" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "url", type: "url", validation: (rule) => rule.required().uri({ scheme: ["https"] }) }),
    defineField({ name: "title", type: "string", description: "Accessible title for the player." }),
  ],
  preview: {
    select: { title: "title", subtitle: "provider" },
    prepare: ({ title, subtitle }) => ({ title: title || "Podcast", subtitle }),
  },
});

export const socialEmbed = defineType({
  name: "socialEmbed",
  title: "Social post",
  type: "object",
  icon: ShareIcon,
  fields: [
    defineField({
      name: "provider",
      type: "string",
      options: {
        list: [
          { title: "X", value: "x" },
          { title: "Instagram", value: "instagram" },
          { title: "TikTok", value: "tiktok" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "url", type: "url", validation: (rule) => rule.required().uri({ scheme: ["https"] }) }),
  ],
  preview: {
    select: { subtitle: "url", provider: "provider" },
    prepare: ({ subtitle, provider }) => ({ title: `Social post (${provider ?? "unknown"})`, subtitle }),
  },
});

export const pullQuote = defineType({
  name: "pullQuote",
  title: "Pull quote",
  type: "object",
  icon: DoubleQuoteIcon,
  fields: [
    defineField({ name: "text", type: "text", rows: 3, validation: (rule) => rule.required().max(300) }),
    defineField({ name: "attribution", type: "string", validation: (rule) => rule.max(120) }),
  ],
  preview: { select: { title: "text", subtitle: "attribution" } },
});

export const callout = defineType({
  name: "callout",
  title: "Callout",
  type: "object",
  icon: InfoOutlineIcon,
  fields: [
    defineField({ name: "title", type: "string", validation: (rule) => rule.max(80) }),
    defineField({ name: "body", type: "text", rows: 4, validation: (rule) => rule.required().max(600) }),
    defineField({
      name: "variant",
      type: "string",
      options: {
        list: [
          { title: "Info", value: "info" },
          { title: "Note", value: "note" },
        ],
        layout: "radio",
      },
      initialValue: "info",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "body" },
    prepare: ({ title, subtitle }) => ({ title: title || "Callout", subtitle }),
  },
});

// Reserved. Not offered in v1 bodies; registered so the type exists when it is.
export const sponsorSlotRef = defineType({
  name: "sponsorSlotRef",
  title: "Sponsor slot",
  type: "object",
  icon: BillIcon,
  fields: [defineField({ name: "slot", type: "reference", to: [{ type: "sponsorSlot" }] })],
});

export const blockTypes = [imageBlock, videoEmbed, podcastEmbed, socialEmbed, pullQuote, callout, sponsorSlotRef];
