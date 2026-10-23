import { defineField, defineType } from "sanity";
import { COPY_SPEC, unknownTokens, type CopyToken } from "../../../lib/site-copy";

type Entry = { title: string; default: string; description?: string; tokens?: readonly CopyToken[]; long?: boolean; max?: number };

function describe(entry: Entry): string {
  const parts = [entry.description, entry.tokens?.length ? `Can use ${entry.tokens.map((t) => `{${t}}`).join(" and ")}.` : null];
  parts.push("Leave empty to keep the text shown.");
  return parts.filter(Boolean).join(" ");
}

// Interface copy, one collapsible group per area. Fields and their defaults come from lib/site-copy.ts.
export const siteCopy = defineType({
  name: "siteCopy",
  title: "Copy",
  type: "object",
  fields: Object.entries(COPY_SPEC).map(([section, { title, fields }]) =>
    defineField({
      name: section,
      title,
      type: "object",
      options: { collapsible: true, collapsed: true },
      fields: Object.entries(fields as Record<string, Entry>).map(([name, entry]) =>
        defineField({
          name,
          title: entry.title,
          type: entry.long ? "text" : "string",
          ...(entry.long ? { rows: 2 } : {}),
          placeholder: entry.default,
          description: describe(entry),
          validation: (rule) =>
            rule.max(entry.max ?? (entry.long ? 300 : 90)).custom((value: string | undefined) => {
              if (!value) return true;
              const bad = unknownTokens(value, entry.tokens);
              return bad.length === 0 || `This field does not fill in ${bad.map((t) => `{${t}}`).join(", ")}`;
            }),
        }),
      ),
    }),
  ),
});
