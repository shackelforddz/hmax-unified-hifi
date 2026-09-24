"use client";

import { useRef } from "react";
import { DUR, EASE, dur, gsap, useGSAP } from "@/lib/motion";

/* ── The track and fill of a bar ─────────────────────────────────────
   Every bar in the product that reads as a measurement - delivery progress,
   asset health, crew utilisation, a scoring factor - is this: a rounded track
   with a coloured fill sized to the figure. They were written out by hand
   wherever one was needed, so they drifted, and only some of them moved.

   The fill is scaled rather than widened: a track is often a flex child that
   resizes with its panel, and scaling leaves the authored width alone instead
   of replacing it with a pixel value that stops responding.

   The figure beside it is counted separately, by useCountUp - the two are
   started in the same frame with the same duration and ease, because the label
   is rarely next to the bar in the markup and threading one timeline through
   both would cost more than it buys. */

interface Props {
  /** How full, 0-100. */
  pct: number;
  /** The track: how thick, how wide, what colour behind the fill. */
  className?: string;
  /** The fill itself, when it isn't the usual chart colour. */
  fillClassName?: string;
  /** Inside a line of text a div is invalid, so the bar becomes spans. */
  inline?: boolean;
  /** Held back to line up with something else arriving, in seconds. */
  delay?: number;
}

export default function BarFill({
  pct,
  className = "flex-1 h-2 bg-gray-100",
  fillClassName = "bg-chart-line",
  inline = false,
  delay = 0,
}: Props) {
  const fill = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (!fill.current) return;
    gsap.from(fill.current, {
      scaleX: 0,
      transformOrigin: "left center",
      duration: dur(DUR.count),
      ease: EASE.entrance,
      delay: dur(delay),
    });
  }, [pct, delay]);

  const Box = inline ? "span" : "div";
  return (
    <Box className={`${inline ? "block " : ""}rounded-full overflow-hidden ${className}`}>
      <Box
        // The authored width is the figure itself, so the bar is right even if
        // none of the above ever runs.
        ref={fill as React.Ref<HTMLDivElement & HTMLSpanElement>}
        className={`block h-full rounded-full ${fillClassName}`}
        style={{ width: `${pct}%` }}
      />
    </Box>
  );
}
