import { PortableText, type PortableTextComponents, type PortableTextBlock } from "next-sanity";
import { stegaClean } from "@sanity/client/stega";
import type { ArticleBody } from "@/lib/types";
import type { ImageWithMeta } from "@/lib/sanity/image";
import { SanityImage } from "./SanityImage";
import { YouTubeEmbed } from "./YouTubeEmbed";
import { PodcastEmbed } from "./PodcastEmbed";
import { SocialEmbed } from "./SocialEmbed";
import { PullQuote } from "./PullQuote";
import { Callout } from "./Callout";

type Block<T extends string> = Extract<ArticleBody[number], { _type: T }>;

function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href) && !href.startsWith(process.env.NEXT_PUBLIC_SITE_URL ?? "https://speakeasysports.com");
}

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p>{children}</p>,
    h2: ({ children }) => <h2>{children}</h2>,
    h3: ({ children }) => <h3>{children}</h3>,
    blockquote: ({ children }) => <blockquote>{children}</blockquote>,
  },
  list: {
    bullet: ({ children }) => <ul>{children}</ul>,
    number: ({ children }) => <ol>{children}</ol>,
  },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    link: ({ children, value }) => {
      const href = stegaClean((value as { href?: string } | undefined)?.href ?? "");
      if (!href) return <>{children}</>;
      const external = isExternal(href);
      return (
        <a href={href} rel={external ? "noopener noreferrer" : undefined} target={external ? "_blank" : undefined}>
          {children}
        </a>
      );
    },
  },
  types: {
    imageBlock: ({ value }: { value: Block<"imageBlock"> }) => {
      const image = value as unknown as ImageWithMeta;
      if (!image.asset || !image.alt) return null;
      return (
        <figure>
          <SanityImage image={image} width={896} sizes="(min-width: 1024px) 896px, 100vw" className="w-full rounded-base" />
          {(image.caption || image.credit) && (
            <figcaption>
              {image.caption}
              {image.caption && image.credit && " "}
              {image.credit && <span className="text-fg-subtle">{image.credit}</span>}
            </figcaption>
          )}
        </figure>
      );
    },
    videoEmbed: ({ value }: { value: Block<"videoEmbed"> }) =>
      value.url ? (
        <figure>
          <YouTubeEmbed url={stegaClean(value.url)} title={value.title} />
        </figure>
      ) : null,
    podcastEmbed: ({ value }: { value: Block<"podcastEmbed"> }) =>
      value.url && value.provider ? (
        <figure>
          <PodcastEmbed provider={stegaClean(value.provider)} url={stegaClean(value.url)} title={value.title} />
        </figure>
      ) : null,
    socialEmbed: ({ value }: { value: Block<"socialEmbed"> }) =>
      value.url && value.provider ? <SocialEmbed provider={stegaClean(value.provider)} url={stegaClean(value.url)} /> : null,
    pullQuote: ({ value }: { value: Block<"pullQuote"> }) => <PullQuote text={value.text} attribution={value.attribution} />,
    callout: ({ value }: { value: Block<"callout"> }) => (
      <Callout title={value.title} body={value.body} variant={stegaClean(value.variant)} />
    ),
    // Reserved for later. Renders nothing in v1.
    sponsorSlotRef: () => null,
  },
  // Unknown blocks render nothing rather than a debug box.
  unknownType: () => null,
  unknownMark: ({ children }) => <>{children}</>,
};

export function PortableTextRenderer({ value }: { value: ArticleBody | null | undefined }) {
  if (!value?.length) return null;
  return (
    <div className="article-body">
      <PortableText value={value as unknown as PortableTextBlock[]} components={components} />
    </div>
  );
}
