"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { presentationTool } from "sanity/presentation";
import { visionTool } from "@sanity/vision";
import { schemaTypes, SINGLETON_TYPES } from "./sanity/schemas";
import { structure } from "./sanity/structure";
import { resolve } from "./sanity/presentation/resolve";
import { apiVersion, dataset, projectId } from "./lib/sanity/env";

export default defineConfig({
  name: "speakeasy",
  title: "Speakeasy Sports",
  basePath: "/studio",
  projectId,
  dataset,
  schema: {
    types: schemaTypes,
    // Singletons are created from the desk structure, never from the "new document" menu.
    templates: (templates) => templates.filter((t) => !SINGLETON_TYPES.has(t.schemaType)),
  },
  document: {
    actions: (actions, context) =>
      SINGLETON_TYPES.has(context.schemaType)
        ? actions.filter((a) => !["unpublish", "delete", "duplicate"].includes(a.action ?? ""))
        : actions,
  },
  plugins: [
    structureTool({ structure }),
    presentationTool({
      resolve,
      previewUrl: {
        previewMode: { enable: "/api/draft" },
      },
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});
