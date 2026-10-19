// Display labels for article content types. Values match sanity/schemas/article.ts.
export const CONTENT_TYPE_LABELS: Record<string, string> = {
  analysis: "Analysis",
  recap: "Recap",
  preview: "Preview",
  feature: "Feature",
  podcast: "Podcast",
  video: "Video",
  news: "News",
  opinion: "Opinion",
};

export function contentTypeLabel(value: string | null | undefined): string {
  if (!value) return "";
  return CONTENT_TYPE_LABELS[value] ?? value.charAt(0).toUpperCase() + value.slice(1);
}
