import Link from "next/link";
import { formatLongDate, formatPublished, isUpdated } from "@/lib/format/date";
import { authorPath } from "@/lib/seo";
import type { ImageWithMeta } from "@/lib/sanity/image";
import { SanityImage } from "./SanityImage";

type Author = {
  _id: string;
  name: string | null;
  slug: string | null;
  photo?: ImageWithMeta | null;
};

type Props = {
  authors: Author[] | null | undefined;
  publishedAt: string | null | undefined;
  updatedAt?: string | null;
};

export function Byline({ authors, publishedAt, updatedAt }: Props) {
  const list = (authors ?? []).filter((a) => a.name);
  const updated = isUpdated(publishedAt, updatedAt);

  return (
    <div className="flex items-center gap-3 font-ui text-sm">
      {list.length > 0 && (
        <div className="flex -space-x-2">
          {list.slice(0, 3).map(
            (a) =>
              a.photo?.asset && (
                <span key={a._id} className="h-10 w-10 overflow-hidden rounded-full border-2 border-bg bg-bg-elev">
                  <SanityImage image={a.photo} alt={a.name ?? ""} width={40} aspect={1} sizes="40px" className="h-full w-full object-cover" />
                </span>
              ),
          )}
        </div>
      )}
      <div>
        {list.length > 0 && (
          <p className="font-semibold text-fg">
            {list.map((a, i) => (
              <span key={a._id}>
                {i > 0 && (i === list.length - 1 ? " and " : ", ")}
                {a.slug ? (
                  <Link href={authorPath(a.slug)} className="no-underline hover:underline">
                    {a.name}
                  </Link>
                ) : (
                  a.name
                )}
              </span>
            ))}
          </p>
        )}
        <p className="text-fg-muted">
          {publishedAt && <time dateTime={publishedAt}>{formatPublished(publishedAt)}</time>}
          {updated && updatedAt && (
            <>
              <span aria-hidden> &middot; </span>
              <time dateTime={updatedAt}>Updated {formatLongDate(updatedAt)}</time>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
