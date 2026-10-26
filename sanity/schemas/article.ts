import { defineArrayMember, defineField, defineType } from "sanity";
import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { altField, imageWithAltFields } from "./shared/imageWithAlt";
import { slugFormat } from "./shared/validation";
import { StatusInput } from "../components/StatusInput";
import { editorsOnly } from "../roles";

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

export const COVERAGE_SCOPES = [
  { title: "School", value: "school" },
  { title: "National", value: "national" },
] as const;

export const HERO_TYPES = [
  { title: "No hero (text only)", value: "none" },
  { title: "Image", value: "image" },
  { title: "Video", value: "video" },
  { title: "Podcast", value: "podcast" },
] as const;

type RefLike = { _ref?: string } | undefined;

/** Documents written before coverage scope existed are school stories. */
const isNational = (doc?: { [key: string]: unknown }) => doc?.coverageScope === "national";

export const article = defineType({
  name: "article",
  title: "Article",
  type: "document",
  icon: DocumentTextIcon,
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "media", title: "Media" },
    { name: "workflow", title: "Workflow" },
    { name: "seo", title: "SEO and social", hidden: editorsOnly },
    { name: "circle", title: "Circle sync", hidden: editorsOnly },
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
      name: "coverageScope",
      title: "Coverage",
      type: "string",
      group: "content",
      description: "National stories live at /national and need no school. School stories live under their primary school.",
      options: { list: [...COVERAGE_SCOPES], layout: "radio", direction: "horizontal" },
      initialValue: "school",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "schools",
      type: "array",
      group: "content",
      description: "For national stories, optional: listing a school also shows the story on that school's front.",
      of: [defineArrayMember({ type: "reference", to: [{ type: "school" }] })],
      validation: (rule) => [
        rule.unique(),
        rule.custom((value: unknown[] | undefined, context) =>
          isNational(context.document) || (value?.length ?? 0) > 0 ? true : "Add at least one school",
        ),
      ],
    }),
    defineField({
      name: "primarySchool",
      type: "reference",
      group: "content",
      to: [{ type: "school" }],
      description: "Sets the canonical URL. Must be one of the schools above.",
      hidden: ({ document }) => isNational(document),
      validation: (rule) =>
        rule.custom((value: RefLike, context) => {
          if (isNational(context.document)) return value?._ref ? "National stories have no primary school. Clear this field." : true;
          if (!value?._ref) return "Pick the primary school";
          const schools = (context.document?.schools as RefLike[] | undefined) ?? [];
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

    // Hero: in Content as well as Media, so a writer on a phone sets it without switching tabs (design sweep S1).
    defineField({
      name: "heroType",
      type: "string",
      group: ["content", "media"],
      description: "Text only is a normal format: use a photo when it adds something.",
      options: { list: [...HERO_TYPES], layout: "radio" },
      initialValue: "none",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "heroImage",
      type: "image",
      group: ["content", "media"],
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
      group: ["content", "media"],
      hidden: ({ document }) => document?.heroType !== "video" && document?.heroType !== "podcast",
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
    defineField({ name: "body", type: "body", group: "content" }),
    defineField({
      name: "tags",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "reference", to: [{ type: "tag" }] })],
      validation: (rule) => rule.unique(),
    }),

    // Media
    defineField({
      name: "episodeSummary",
      type: "text",
      rows: 4,
      group: "media",
      description: "Shown under the player for podcast and video leads.",
      hidden: ({ document }) => document?.heroType !== "video" && document?.heroType !== "podcast",
      validation: (rule) => rule.max(1200),
    }),
    defineField({
      name: "episodeTimestamps",
      type: "array",
      group: "media",
      of: [defineArrayMember({ type: "episodeTimestamp" })],
      hidden: ({ document }) => document?.heroType !== "video" && document?.heroType !== "podcast",
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
      hidden: editorsOnly,
      description: "Set by editors on publish or schedule. Filled in automatically if left empty.",
    }),
    defineField({
      name: "updatedAt",
      type: "datetime",
      group: "workflow",
      hidden: editorsOnly,
      description: 'Set on any edit after publish. Renders as "Updated ..." when later than the publish time.',
    }),
    defineField({
      name: "correction",
      type: "text",
      rows: 3,
      group: "workflow",
      hidden: editorsOnly,
      description: "Rendered at the end of the article. Corrections are never silent.",
      validation: (rule) => rule.max(1000),
    }),
    // Retired by the single homepage lead in Site settings > Editorial (docs/specs/phase-1-ux-update.md, 4.1). Kept on
    // documents, hidden, so nothing is lost and no migration is needed to remove them.
    defineField({ name: "featured", type: "boolean", group: "workflow", hidden: true, readOnly: true }),
    defineField({ name: "featuredRank", type: "number", group: "workflow", hidden: true, readOnly: true }),
    defineField({
      name: "memberOnly",
      type: "boolean",
      group: "workflow",
      hidden: editorsOnly,
      initialValue: false,
      description: "Enforced in Phase 2 only.",
    }),

    // SEO and social
    defineField({ name: "seoTitle", type: "string", group: "seo", hidden: editorsOnly, validation: (rule) => rule.max(70) }),
    defineField({ name: "seoDescription", type: "text", rows: 2, group: "seo", hidden: editorsOnly, validation: (rule) => rule.max(160) }),
    defineField({
      name: "ogImageOverride",
      type: "image",
      group: "seo",
      hidden: editorsOnly,
      description: "Replaces the generated social card.",
      fields: [altField],
    }),
    defineField({ name: "noIndex", type: "boolean", group: "seo", hidden: editorsOnly, initialValue: false }),

    // Circle sync, written by the webhook handler
    defineField({ name: "circlePostId", type: "string", group: "circle", readOnly: true, hidden: editorsOnly }),
    defineField({ name: "circlePostUrl", type: "url", group: "circle", readOnly: true, hidden: editorsOnly }),
    defineField({ name: "circleCommentCount", type: "number", group: "circle", readOnly: true, hidden: editorsOnly }),
    defineField({ name: "circleSyncedAt", type: "datetime", group: "circle", readOnly: true, hidden: editorsOnly }),
    defineField({ name: "circleSyncError", type: "string", group: "circle", readOnly: true, hidden: editorsOnly }),
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
