import type { ArticleCard } from "@/lib/types";
import { StoryCard } from "./StoryCard";

type Props = { articles: ArticleCard[] | null | undefined; heading: string; hideAuthors?: boolean };

export function RelatedStories({ articles, heading, hideAuthors }: Props) {
  const list = (articles ?? []).filter((a) => a.path);
  if (list.length === 0) return null;
  return (
    <section aria-labelledby="related-h" className="mx-auto mt-16 max-w-4xl border-t border-line pt-8">
      <h2 id="related-h" className="label-caps mb-6 text-fg-muted">
        {heading}
      </h2>
      <div className="grid gap-8 sm:grid-cols-2">
        {list.map((a) => (
          <StoryCard key={a._id} article={a} hideAuthors={hideAuthors} imageWidth={440} sizes="(min-width: 640px) 430px, 100vw" />
        ))}
      </div>
    </section>
  );
}
