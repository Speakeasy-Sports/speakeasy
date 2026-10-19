import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { client } from "@/lib/sanity/client";
import { ARTICLE_OG_QUERY } from "@/lib/sanity/queries";
import { tags } from "@/lib/sanity/tags";
import { contentTypeLabel } from "@/lib/content-types";
import { accentForeground, isHex } from "@/lib/color";
import { SITE_NAME } from "@/lib/seo";

const WIDTH = 1200;
const HEIGHT = 630;
const CACHE = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

/**
 * Social card for an article: headline, school accent, Speakeasy mark, author (AGENTS.md section 6).
 * Published content only, cached at the edge for a day. Headline and names are drawn as text, so no
 * input reaches the markup unescaped.
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return new Response("Bad slug", { status: 400 });

  const article = await client.fetch(ARTICLE_OG_QUERY, { slug }, { next: { revalidate: 3600, tags: [tags.articleSlug(slug)] } });
  if (!article) return new Response("Not found", { status: 404, headers: { "Cache-Control": "public, max-age=300" } });

  const accent = isHex(article.school?.accentColor) ? article.school.accentColor : "#141414";
  const accentFg = accentForeground(accent);
  const title = truncate(article.title ?? "", 110);
  const authors = (article.authors ?? []).map((a) => a.name).filter(Boolean).join(", ");
  const kicker = [contentTypeLabel(article.contentType), article.school?.shortName].filter(Boolean).join("  /  ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fcfbf8",
          color: "#141414",
          padding: "64px 72px",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 26,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: accent,
              fontWeight: 700,
            }}
          >
            <div style={{ width: 14, height: 56, background: accent }} />
            {kicker}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: title.length > 70 ? 56 : 68, lineHeight: 1.08, fontWeight: 700, letterSpacing: -1.5 }}>{title}</div>
          {authors && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, color: "#5b5b57" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  background: accent,
                  color: accentFg,
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                {authors.charAt(0).toUpperCase()}
              </div>
              {authors}
            </div>
          )}
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT, headers: { "Cache-Control": CACHE } },
  );
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > max * 0.6 ? cut.lastIndexOf(" ") : cut.length)}…`;
}
