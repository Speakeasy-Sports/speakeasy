import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { client } from "@/lib/sanity/client";
import { readToken } from "@/lib/sanity/token";

// Enables draft mode from the Studio's Presentation tool (sanity.config.ts previewUrl.previewMode.enable).
export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token: readToken, useCdn: false }),
});
