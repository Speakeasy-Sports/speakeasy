import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { dataset, projectId } from "./env";

const builder = createImageUrlBuilder({ projectId, dataset });

export function urlFor(source: SanityImageSource) {
  return builder.image(source).auto("format");
}

// Shape of an image as the GROQ queries project it (asset expanded, nulls where Sanity has no value).
export type ImageWithMeta = {
  asset?: {
    _id?: string | null;
    url?: string | null;
    metadata?: {
      lqip?: string | null;
      dimensions?: { width?: number | null; height?: number | null } | null;
    } | null;
  } | null;
  hotspot?: unknown;
  crop?: unknown;
  alt?: string | null;
  caption?: string | null;
  credit?: string | null;
};

export function hasAsset(image: ImageWithMeta | null | undefined): image is ImageWithMeta & { asset: { _id: string } } {
  return Boolean(image?.asset?._id);
}
