import { defineArrayMember, defineField, defineType, type ReferenceFilterResolver } from "sanity";
import { HomeIcon } from "@sanity/icons/Home";

export const FRONT_PAGE_ID = "frontPage";

// The home page's top stories, in order (AGENTS.md section 6). Weak references, so a picked article can still be
// unpublished or deleted; the site skips any pick that is not live and fills the slot with the newest story.
type TopStoriesOptions = { description: string; filter?: ReferenceFilterResolver; group?: string };

export const topStoriesField = ({ description, filter, group }: TopStoriesOptions) =>
  defineField({
    name: "topStories",
    title: "Top stories",
    type: "array",
    description,
    group,
    of: [defineArrayMember({ type: "reference", to: [{ type: "article" }], weak: true, ...(filter ? { options: { filter } } : {}) })],
    validation: (rule) => rule.max(4).unique(),
  });

export const frontPage = defineType({
  name: "frontPage",
  title: "Front page",
  type: "document",
  icon: HomeIcon,
  fields: [
    topStoriesField({
      description:
        "Up to four. The first is the lead; the next three fill the row under it. Drag to reorder. Empty slots fill with the newest stories, and a school front with no picks of its own uses the picks here that cover it.",
    }),
  ],
  preview: { prepare: () => ({ title: "Front page" }) },
});
