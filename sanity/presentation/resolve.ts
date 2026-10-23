import { defineLocations, type PresentationPluginOptions } from "sanity/presentation";

// Tells the Presentation tool where each document appears on the site.
export const resolve: PresentationPluginOptions["resolve"] = {
  locations: {
    article: defineLocations({
      select: { title: "title", slug: "slug.current", school: "primarySchool.slug.current" },
      resolve: (doc) => ({
        locations: [
          { title: doc?.title || "Untitled", href: `/${doc?.school ?? "_"}/${doc?.slug ?? ""}` },
          { title: "Home", href: "/" },
        ],
      }),
    }),
    frontPage: defineLocations({ locations: [{ title: "Home", href: "/" }] }),
    school: defineLocations({
      select: { title: "name", slug: "slug.current" },
      resolve: (doc) => ({
        locations: [{ title: doc?.title || "School", href: `/${doc?.slug ?? ""}` }],
      }),
    }),
    author: defineLocations({
      select: { title: "name", slug: "slug.current" },
      resolve: (doc) => ({
        locations: [{ title: doc?.title || "Author", href: `/authors/${doc?.slug ?? ""}` }],
      }),
    }),
    tag: defineLocations({
      select: { title: "name", slug: "slug.current" },
      resolve: (doc) => ({
        locations: [{ title: doc?.title || "Tag", href: `/tags/${doc?.slug ?? ""}` }],
      }),
    }),
  },
};
