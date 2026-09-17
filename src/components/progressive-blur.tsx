/* Progressive blur: stacked backdrop blurs, each masked to a shorter band
   from one edge, so content is heavily blurred at that edge and comes back
   into focus across the band. */
const LAYERS = [
  { blur: 1, stop: [75, 100] },
  { blur: 2, stop: [55, 80] },
  { blur: 4, stop: [40, 65] },
  { blur: 8, stop: [25, 50] },
  { blur: 16, stop: [10, 35] },
];

/* Chrome doesn't clip a backdrop-filtered element to an ancestor's rounded
   corners, so each layer carries the radius itself (`className`). */
export default function ProgressiveBlur({ from = "top", className = "" }: { from?: "top" | "bottom"; className?: string }) {
  const to = from === "top" ? "bottom" : "top";
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      {LAYERS.map(({ blur, stop }) => {
        const mask = `linear-gradient(to ${to}, black 0%, black ${stop[0]}%, transparent ${stop[1]}%)`;
        return (
          <div
            key={blur}
            className={`absolute inset-0 ${className}`}
            style={{
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}
    </div>
  );
}
