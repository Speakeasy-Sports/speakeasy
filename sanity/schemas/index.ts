import type { SchemaTypeDefinition } from "sanity";
import { school } from "./school";
import { author } from "./author";
import { tag } from "./tag";
import { article } from "./article";
import { sponsorSlot } from "./sponsorSlot";
import { siteSettings } from "./siteSettings";
import { infoPage } from "./infoPage";
import { heroEmbed } from "./objects/heroEmbed";
import { episodeTimestamp } from "./objects/episodeTimestamp";
import { body } from "./objects/body";
import { blockTypes } from "./blocks";

export const schemaTypes: SchemaTypeDefinition[] = [
  // documents
  article,
  school,
  author,
  tag,
  sponsorSlot,
  siteSettings,
  infoPage,
  // objects
  heroEmbed,
  episodeTimestamp,
  body,
  ...blockTypes,
];

export const SINGLETON_TYPES = new Set(["siteSettings"]);
