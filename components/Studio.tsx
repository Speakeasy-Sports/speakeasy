"use client";

import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

// Client boundary for the embedded Studio so the config (which contains functions) never crosses from the server.
export function Studio() {
  return <NextStudio config={config} />;
}
