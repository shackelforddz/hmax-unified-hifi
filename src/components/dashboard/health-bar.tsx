"use client";

import { useRef } from "react";
import { DUR, EASE, dur, gsap, useGSAP } from "@/lib/motion";

/* ── One health bar ──────────────────────────────────────────────────
   There were four of these, drawn slightly differently in four files. They
   are all the same reading of the same thing, so they are one component now,
   with the only real differences - how thick, how wide, what colour behind it,
   and whether it can sit inside a line of text - left as props.

   The bar fills from nothing and the percentage counts with it, on one clock,
   so the pair reads as a measurement being taken rather than a number with a
   coloured rectangle beside it. It is scaled rather than widened: the track can
   be a flex child that resizes with its panel, and scaling leaves the authored
   width alone instead of replacing it with a pixel value. */

interface Props {
  pct: number;
  /** Reads as critical below this. Omitted: always the chart colour. */
  lowAt?: number;
  /** Inside a line of text a div is invalid, so the whole bar becomes spans. */
  inline?: boolean;
  /** The bar and its label together. */
  className?: string;
  /** The track the fill runs along - its height, and the colour behind it. */
  trackClassName?: string;
}

export default function HealthBar({
  pct,
  lowAt,
  inline = false,
  className = "flex items-center gap-2",
  trackClassName = "flex-1 h-1.5 bg-gray-100",
}: Props) {
  const fill = useRef<HTMLElement>(null);
  const label = useRef<HTMLElement>(null);
  const low = lowAt !== undefined && pct < lowAt;

  useGSAP(() => {
    const tl = gsap.timeline();
    if (fill.current) {
      tl.from(
        fill.current,
        { scaleX: 0, transformOrigin: "left center", duration: dur(DUR.count), ease: EASE.entrance },
        0
      );
    }
    const el = label.current;
    if (el) {
      const proxy = { n: 0 };
      tl.to(
        proxy,
        {
          n: pct,
          duration: dur(DUR.count),
          ease: EASE.entrance,
          onUpdate: () => {
            el.textContent = `${Math.round(proxy.n)}%`;
          },
          // Land on the figure itself, never on a rounding of the way up.
          onComplete: () => {
            el.textContent = `${pct}%`;
          },
        },
        0
      );
    }
  }, [pct]);

  const Box = inline ? "span" : "div";
  const Bar = inline ? "span" : "div";

  return (
    <Box className={className}>
      <Bar className={`${inline ? "block " : ""}rounded-full overflow-hidden ${trackClassName}`}>
        <Bar
          // The ref is on the fill, whose authored width is the figure itself -
          // so the bar is right even if none of the above ever runs.
          ref={fill as React.Ref<HTMLDivElement & HTMLSpanElement>}
          className={`block h-full rounded-full ${low ? "bg-status-critical" : "bg-chart-line"}`}
          style={{ width: `${pct}%` }}
        />
      </Bar>
      <span
        ref={label as React.Ref<HTMLSpanElement>}
        className={`text-xs shrink-0 ${low ? "text-gray-900" : "text-gray-500"}`}
      >
        {pct}%
      </span>
    </Box>
  );
}
