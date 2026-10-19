import type { ArticleCard } from "@/lib/types";
import { StoryCard } from "./StoryCard";

export function RelatedStories({ articles }: { articles: ArticleCard[] | null | undefined }) {
  const list = (articles ?? []).filter((a) => a.slug && a.school?.slug);
  if (list.length === 0) return null;
  return (
    <section aria-labelledby="related-h" className="mt-16 border-t border-line pt-8">
      <h2 id="related-h" className="label-caps mb-6 text-fg-muted">
        More to read
      </h2>
      <div className="grid gap-8 md:grid-cols-3">
        {list.map((a) => (
          <StoryCard key={a._id} article={a} imageWidth={400} sizes="(min-width: 768px) 300px, 100vw" />
        ))}
      </div>
    </section>
  );
}
