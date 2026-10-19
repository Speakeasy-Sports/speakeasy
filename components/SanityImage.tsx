import Image from "next/image";
import { hasAsset, urlFor, type ImageWithMeta } from "@/lib/sanity/image";

type Props = {
  image: ImageWithMeta | null | undefined;
  /** Rendered width in CSS pixels at the largest breakpoint. The loader produces the srcset. */
  width: number;
  /** Aspect ratio as width/height. Omit to keep the asset's own ratio. */
  aspect?: number;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Alt override, for images whose alt lives on a parent (author photos). */
  alt?: string;
};

/**
 * next/image over the Sanity CDN. Crops through the hotspot when an aspect is given.
 * Every image needs alt text; the schema enforces it, this component refuses to render without it.
 */
export function SanityImage({ image, width, aspect, sizes, priority, className, alt }: Props) {
  if (!hasAsset(image)) return null;
  const altText = alt ?? image.alt;
  if (!altText) return null;

  const dims = image.asset.metadata?.dimensions;
  const naturalRatio = dims?.width && dims?.height ? dims.width / dims.height : 16 / 9;
  const ratio = aspect ?? naturalRatio;
  const height = Math.round(width / ratio);

  const builder = urlFor(image).width(width).height(height).fit("crop");
  const lqip = image.asset.metadata?.lqip ?? undefined;

  return (
    <Image
      src={builder.url()}
      alt={altText}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      placeholder={lqip ? "blur" : "empty"}
      blurDataURL={lqip}
      className={className}
    />
  );
}
