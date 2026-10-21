type Props = {
  /** "video" reserves 16:9; "podcast" reserves a fixed pixel height. */
  kind: "video" | "podcast";
  height?: number;
  children: React.ReactNode;
  className?: string;
};

/** Fixed-size container for embeds so nothing shifts when a player loads. */
export function MediaFrame({ kind, height = 152, children, className = "" }: Props) {
  const style = kind === "video" ? { aspectRatio: "16 / 9" } : { height: `${height}px` };
  return (
    <div
      className={`relative w-full overflow-hidden bg-bg-elev ${className}`}
      style={style}
      data-media-frame={kind}
    >
      {children}
    </div>
  );
}
