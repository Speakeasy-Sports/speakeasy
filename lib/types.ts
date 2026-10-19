import type {
  ARTICLE_QUERY_RESULT,
  HOME_LATEST_QUERY_RESULT,
  SCHOOL_QUERY_RESULT,
  SITE_SETTINGS_QUERY_RESULT,
} from "@/sanity.types";

export type Article = NonNullable<ARTICLE_QUERY_RESULT>;
export type ArticleCard = HOME_LATEST_QUERY_RESULT[number];
export type SchoolRef = NonNullable<Article["school"]>;
export type AuthorRef = NonNullable<Article["authors"]>[number];
export type School = NonNullable<SCHOOL_QUERY_RESULT>;
export type SiteSettings = NonNullable<SITE_SETTINGS_QUERY_RESULT>;
export type Sponsor = NonNullable<Article["sponsor"]>;
export type ArticleBody = NonNullable<Article["body"]>;
