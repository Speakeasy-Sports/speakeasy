import type { StructureResolver } from "sanity/structure";
import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { ClockIcon } from "@sanity/icons/Clock";
import { PublishIcon } from "@sanity/icons/Publish";
import { EditIcon } from "@sanity/icons/Edit";
import { CommentIcon } from "@sanity/icons/Comment";
import { HomeIcon } from "@sanity/icons/Home";
import { UserIcon } from "@sanity/icons/User";
import { TagIcon } from "@sanity/icons/Tag";
import { BillIcon } from "@sanity/icons/Bill";
import { CogIcon } from "@sanity/icons/Cog";
import { DocumentIcon } from "@sanity/icons/Document";
import { SITE_SETTINGS_ID } from "./schemas/siteSettings";
import { FRONT_PAGE_ID } from "./schemas/frontPage";
import { StarIcon } from "@sanity/icons/Star";

// Desk structure (AGENTS.md section 5): Articles by status, Front page, Schools, Authors, Tags, Sponsor slots, Pages, Settings.
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Speakeasy Sports")
    .items([
      S.listItem()
        .title("Articles")
        .icon(DocumentTextIcon)
        .child(
          S.list()
            .title("Articles")
            .items([
              S.listItem()
                .title("Needs review")
                .icon(CommentIcon)
                .child(
                  S.documentList()
                    .title("Needs review")
                    .schemaType("article")
                    .filter('_type == "article" && status == "review"')
                    .defaultOrdering([{ field: "_updatedAt", direction: "desc" }]),
                ),
              S.listItem()
                .title("Scheduled")
                .icon(ClockIcon)
                .child(
                  S.documentList()
                    .title("Scheduled")
                    .schemaType("article")
                    .filter('_type == "article" && status == "scheduled"')
                    .defaultOrdering([{ field: "publishedAt", direction: "asc" }]),
                ),
              S.listItem()
                .title("Published")
                .icon(PublishIcon)
                .child(
                  S.documentList()
                    .title("Published")
                    .schemaType("article")
                    .filter('_type == "article" && status == "published"')
                    .defaultOrdering([{ field: "publishedAt", direction: "desc" }]),
                ),
              S.listItem()
                .title("Drafts")
                .icon(EditIcon)
                .child(
                  S.documentList()
                    .title("Drafts")
                    .schemaType("article")
                    .filter('_type == "article" && (status == "draft" || !defined(status))')
                    .defaultOrdering([{ field: "_updatedAt", direction: "desc" }]),
                ),
              S.divider(),
              S.documentTypeListItem("article").title("All articles"),
            ]),
        ),
      S.listItem()
        .title("Front page")
        .icon(StarIcon)
        .child(S.document().schemaType("frontPage").documentId(FRONT_PAGE_ID).title("Front page")),
      S.divider(),
      S.documentTypeListItem("school").title("Schools").icon(HomeIcon),
      S.documentTypeListItem("author").title("Authors").icon(UserIcon),
      S.documentTypeListItem("tag").title("Tags").icon(TagIcon),
      S.documentTypeListItem("sponsorSlot").title("Sponsor slots").icon(BillIcon),
      S.documentTypeListItem("infoPage").title("Pages").icon(DocumentIcon),
      S.divider(),
      S.listItem()
        .title("Settings")
        .icon(CogIcon)
        .child(S.document().schemaType("siteSettings").documentId(SITE_SETTINGS_ID).title("Site settings")),
    ]);
