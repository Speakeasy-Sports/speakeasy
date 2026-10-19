type Props = {
  kind: "podcast" | "video" | "story";
  /** Seeds the waveform so each episode gets its own shape. */
  seed: string;
  label?: string | null;
  size?: "sm" | "md" | "lg";
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Artwork for stories with no photo (podcast and video leads, mostly): an accent-tinted panel with a waveform
 * drawn from the title, so a grid of episodes reads as a set rather than a row of gray boxes. Pure SVG, no requests.
 */
export function MediaArt({ kind, seed, label, size = "md" }: Props) {
  const h = hash(seed);
  const bars = 48;
  const heights = Array.from({ length: bars }, (_, i) => {
    const wave = Math.sin((i / bars) * Math.PI * (2 + (h % 3))) * 0.35 + 0.5;
    const jitter = ((h >> (i % 24)) & 7) / 14;
    return Math.max(0.08, Math.min(1, wave * 0.7 + jitter * 0.45));
  });

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: "color-mix(in srgb, var(--accent) 13%, var(--bg-elev))" }}
    >
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${bars * 6} 100`}
        preserveAspectRatio="none"
        className="absolute inset-x-[8%] top-[22%] h-[46%] w-[84%]"
      >
        {heights.map((v, i) => (
          <rect
            key={i}
            x={i * 6 + 1.5}
            y={50 - v * 48}
            width={3}
            height={v * 96}
            rx={1.5}
            fill="var(--accent)"
            opacity={kind === "video" ? 0.22 : 0.5}
          />
        ))}
      </svg>
      {kind === "video" && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.5v13l10.5-6.5z" />
            </svg>
          </span>
        </span>
      )}
      {label && (
        <span
          className={`absolute left-0 top-0 font-display font-semibold tracking-tight text-accent ${
            size === "lg" ? "p-6 text-4xl" : size === "sm" ? "p-2 text-sm" : "p-4 text-xl"
          }`}
        >
          {label}
        </span>
      )}
    </div>
  );
}
