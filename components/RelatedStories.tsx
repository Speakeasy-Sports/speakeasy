import type { ArticleCard } from "@/lib/types";
import { StoryCard } from "./StoryCard";

type Props = { articles: ArticleCard[] | null | undefined; heading: string; hideAuthors?: boolean };

export function RelatedStories({ articles, heading, hideAuthors }: Props) {
  const list = (articles ?? []).filter((a) => a.slug && a.school?.slug);
  if (list.length === 0) return null;
  return (
    <section aria-labelledby="related-h" className="mt-16 border-t border-line pt-8">
      <h2 id="related-h" className="label-caps mb-6 text-fg-muted">
        {heading}
      </h2>
      <div className="grid gap-8 md:grid-cols-3">
        {list.map((a) => (
          <StoryCard key={a._id} article={a} hideAuthors={hideAuthors} imageWidth={400} sizes="(min-width: 768px) 300px, 100vw" />
        ))}
      </div>
    </section>
  );
}
