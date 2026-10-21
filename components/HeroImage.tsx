import type { ImageWithMeta } from "@/lib/sanity/image";
import { SanityImage } from "./SanityImage";

export function HeroImage({ image }: { image: ImageWithMeta | null | undefined }) {
  if (!image?.asset) return null;
  const hasText = Boolean(image.caption || image.credit);

  return (
    <figure className="my-8">
      <div className="overflow-hidden bg-bg-elev" style={{ aspectRatio: "16 / 9" }}>
        <SanityImage
          image={image}
          width={1200}
          aspect={16 / 9}
          sizes="(min-width: 1024px) 896px, 100vw"
          priority
          className="h-full w-full object-cover"
        />
      </div>
      {hasText && (
        <figcaption className="mt-2 font-ui text-sm text-fg-muted">
          {image.caption}
          {image.caption && image.credit && " "}
          {image.credit && <span className="text-fg-subtle">{image.credit}</span>}
        </figcaption>
      )}
    </figure>
  );
}
