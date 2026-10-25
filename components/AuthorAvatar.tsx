import type { ImageWithMeta } from "@/lib/sanity/image";
import { SanityImage } from "./SanityImage";

type Props = {
  name: string;
  photo?: ImageWithMeta | null;
  /** Rendered size in CSS px. */
  size: number;
  className?: string;
};

/**
 * An author's photo, or their initial in the section color when there is no photo yet, so every byline keeps the same
 * shape and alignment (design sweep F11). The name always sits beside it, so both are decorative here.
 */
export function AuthorAvatar({ name, photo, size, className = "" }: Props) {
  const box = { width: size, height: size };
  if (photo?.asset) {
    return (
      <span className={`shrink-0 overflow-hidden rounded-full bg-bg-elev ${className}`} style={box}>
        <SanityImage image={photo} decorative width={size * 2} aspect={1} sizes={`${size}px`} className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent font-ui font-semibold leading-none text-accent-fg ${className}`}
      style={{ ...box, fontSize: Math.round(size * 0.42) }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
