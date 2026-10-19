import type {
  ARTICLE_QUERY_RESULT,
  HOME_QUERY_RESULT,
  SCHOOL_FRONT_QUERY_RESULT,
  SITE_SETTINGS_QUERY_RESULT,
} from "@/sanity.types";

export type Article = NonNullable<ARTICLE_QUERY_RESULT>;
export type ArticleCard = HOME_QUERY_RESULT["latest"][number];
export type SchoolRef = NonNullable<Article["school"]>;
export type AuthorRef = NonNullable<Article["authors"]>[number];
export type School = NonNullable<SCHOOL_FRONT_QUERY_RESULT>;
export type SiteSettings = NonNullable<SITE_SETTINGS_QUERY_RESULT>;
export type Sponsor = NonNullable<Article["sponsor"]>;
export type ArticleBody = NonNullable<Article["body"]>;
