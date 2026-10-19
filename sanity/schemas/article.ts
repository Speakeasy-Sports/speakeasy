import { defineArrayMember, defineField, defineType } from "sanity";
import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { imageWithAltFields } from "./shared/imageWithAlt";
import { slugFormat } from "./shared/validation";
import { StatusInput } from "../components/StatusInput";

export const CONTENT_TYPES = [
  { title: "Analysis", value: "analysis" },
  { title: "Recap", value: "recap" },
  { title: "Preview", value: "preview" },
  { title: "Feature", value: "feature" },
  { title: "Podcast", value: "podcast" },
  { title: "Video", value: "video" },
  { title: "News", value: "news" },
  { title: "Opinion", value: "opinion" },
] as const;

export const ARTICLE_STATUSES = [
  { title: "Draft", value: "draft" },
  { title: "Needs review", value: "review" },
  { title: "Scheduled", value: "scheduled" },
  { title: "Published", value: "published" },
] as const;

type RefLike = { _ref?: string } | undefined;

export const article = defineType({
  name: "article",
  title: "Article",
  type: "document",
  icon: DocumentTextIcon,
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "media", title: "Media" },
    { name: "workflow", title: "Workflow" },
    { name: "seo", title: "SEO and social" },
    { name: "circle", title: "Circle sync" },
  ],
  fields: [
    // Identity
    defineField({
      name: "title",
      type: "string",
      group: "content",
      validation: (rule) => rule.required().max(90),
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "content",
      options: { source: "title", maxLength: 80 },
      validation: (rule) => rule.required().custom(slugFormat),
    }),
    defineField({
      name: "dek",
      type: "string",
      group: "content",
      description: "One or two sentences under the headline. Also used as the summary in feeds and Circle posts.",
      validation: (rule) => rule.required().max(200),
    }),
    defineField({
      name: "contentType",
      type: "string",
      group: "content",
      options: { list: [...CONTENT_TYPES] },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "schools",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "reference", to: [{ type: "school" }] })],
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: "primarySchool",
      type: "reference",
      group: "content",
      to: [{ type: "school" }],
      description: "Sets the canonical URL. Must be one of the schools above.",
      validation: (rule) =>
        rule.required().custom((value: RefLike, context) => {
          const schools = (context.document?.schools as RefLike[] | undefined) ?? [];
          if (!value?._ref) return true;
          return schools.some((s) => s?._ref === value._ref) || "Primary school must be listed in Schools";
        }),
    }),
    defineField({
      name: "authors",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "reference", to: [{ type: "author" }] })],
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: "tags",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "reference", to: [{ type: "tag" }] })],
      validation: (rule) => rule.unique(),
    }),
    defineField({ name: "body", type: "body", group: "content" }),

    // Media
    defineField({
      name: "heroType",
      type: "string",
      group: "media",
      options: {
        list: [
          { title: "Image", value: "image" },
          { title: "Video", value: "video" },
          { title: "Podcast", value: "podcast" },
        ],
        layout: "radio",
      },
      initialValue: "image",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "heroImage",
      type: "image",
      group: "media",
      options: { hotspot: true },
      fields: imageWithAltFields,
      hidden: ({ document }) => document?.heroType !== "image",
      validation: (rule) =>
        rule.custom((value, context) => {
          if (context.document?.heroType === "image" && !value?.asset) return "A hero image is required";
          return true;
        }),
    }),
    defineField({
      name: "heroEmbed",
      type: "heroEmbed",
      group: "media",
      hidden: ({ document }) => document?.heroType === "image",
      validation: (rule) =>
        rule.custom((value: { url?: string; provider?: string } | undefined, context) => {
          const type = context.document?.heroType;
          if (type !== "video" && type !== "podcast") return true;
          if (!value?.url) return "A hero embed is required";
          if (type === "video" && value.provider !== "youtube") return "Video leads use a YouTube URL";
          if (type === "podcast" && value.provider === "youtube") return "Podcast leads use Spotify, Apple Podcasts, or another audio player";
          return true;
        }),
    }),
    defineField({
      name: "episodeSummary",
      type: "text",
      rows: 4,
      group: "media",
      description: "Shown under the player for podcast and video leads.",
      hidden: ({ document }) => document?.heroType === "image",
      validation: (rule) => rule.max(1200),
    }),
    defineField({
      name: "episodeTimestamps",
      type: "array",
      group: "media",
      of: [defineArrayMember({ type: "episodeTimestamp" })],
      hidden: ({ document }) => document?.heroType === "image",
    }),

    // Workflow
    defineField({
      name: "status",
      type: "string",
      group: "workflow",
      options: { list: [...ARTICLE_STATUSES], layout: "radio" },
      initialValue: "draft",
      description:
        'Contributors set "Needs review". Editors schedule or publish; the site sets "Published" when the document publishes.',
      components: { input: StatusInput },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "publishedAt",
      type: "datetime",
      group: "workflow",
      description: "Set by editors on publish or schedule. Filled in automatically if left empty.",
    }),
    defineField({
      name: "updatedAt",
      type: "datetime",
      group: "workflow",
      description: 'Set on any edit after publish. Renders as "Updated ..." when later than the publish time.',
    }),
    defineField({
      name: "correction",
      type: "text",
      rows: 3,
      group: "workflow",
      description: "Rendered at the end of the article. Corrections are never silent.",
      validation: (rule) => rule.max(1000),
    }),
    defineField({ name: "featured", type: "boolean", group: "workflow", initialValue: false }),
    defineField({
      name: "featuredRank",
      type: "number",
      group: "workflow",
      description: "1 is the homepage lead. 2 to 4 fill the secondary row.",
      hidden: ({ document }) => !document?.featured,
      validation: (rule) =>
        rule
          .integer()
          .min(1)
          .max(4)
          .custom((value, context) => {
            if (context.document?.featured && !value) return "Pick a rank for featured articles";
            return true;
          }),
    }),
    defineField({
      name: "memberOnly",
      type: "boolean",
      group: "workflow",
      initialValue: false,
      description: "Enforced in Phase 2 only.",
    }),

    // SEO and social
    defineField({ name: "seoTitle", type: "string", group: "seo", validation: (rule) => rule.max(70) }),
    defineField({ name: "seoDescription", type: "text", rows: 2, group: "seo", validation: (rule) => rule.max(160) }),
    defineField({
      name: "ogImageOverride",
      type: "image",
      group: "seo",
      description: "Replaces the generated social card.",
    }),
    defineField({ name: "noIndex", type: "boolean", group: "seo", initialValue: false }),

    // Circle sync, written by the webhook handler
    defineField({ name: "circlePostId", type: "string", group: "circle", readOnly: true }),
    defineField({ name: "circlePostUrl", type: "url", group: "circle", readOnly: true }),
    defineField({ name: "circleCommentCount", type: "number", group: "circle", readOnly: true }),
    defineField({ name: "circleSyncedAt", type: "datetime", group: "circle", readOnly: true }),
    defineField({ name: "circleSyncError", type: "string", group: "circle", readOnly: true }),
  ],
  orderings: [
    { title: "Publish date, newest", name: "publishedAtDesc", by: [{ field: "publishedAt", direction: "desc" }] },
    { title: "Title", name: "title", by: [{ field: "title", direction: "asc" }] },
  ],
  preview: {
    select: {
      title: "title",
      status: "status",
      contentType: "contentType",
      school: "primarySchool.shortName",
      media: "heroImage",
      publishedAt: "publishedAt",
    },
    prepare: ({ title, status, contentType, school, media, publishedAt }) => ({
      title,
      subtitle: [status, contentType, school, publishedAt ? new Date(publishedAt).toLocaleDateString("en-US") : null]
        .filter(Boolean)
        .join(" / "),
      media,
    }),
  },
});
