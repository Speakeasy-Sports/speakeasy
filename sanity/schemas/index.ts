import type { SchemaTypeDefinition } from "sanity";
import { school } from "./school";
import { author } from "./author";
import { tag } from "./tag";
import { article } from "./article";
import { sponsorSlot } from "./sponsorSlot";
import { siteSettings } from "./siteSettings";
import { infoPage } from "./infoPage";
import { frontPage } from "./frontPage";
import { heroEmbed } from "./objects/heroEmbed";
import { episodeTimestamp } from "./objects/episodeTimestamp";
import { body } from "./objects/body";
import { navLink, footerColumn } from "./objects/navLink";
import { siteCopy } from "./objects/siteCopy";
import { pageSeo } from "./objects/pageSeo";
import { blockTypes } from "./blocks";

export const schemaTypes: SchemaTypeDefinition[] = [
  // documents
  article,
  school,
  author,
  tag,
  sponsorSlot,
  siteSettings,
  frontPage,
  infoPage,
  // objects
  heroEmbed,
  episodeTimestamp,
  body,
  navLink,
  footerColumn,
  siteCopy,
  pageSeo,
  ...blockTypes,
];

export const SINGLETON_TYPES = new Set(["siteSettings", "frontPage"]);
