"use client";

import BarFill from "./bar-fill";
import { useCountUp } from "@/lib/motion";

/* ── A bar with its figure beside it ─────────────────────────────────
   The common arrangement: the bar, then the percentage it represents. There
   were four of these drawn slightly differently in four files, so they are one
   component now, with the only real differences - how thick, how wide, what
   colour behind it, and whether it can sit inside a line of text - left as
   props. Bars whose figure sits somewhere else in the layout use BarFill and
   useCountUp directly instead. */

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
  const low = lowAt !== undefined && pct < lowAt;
  const label = `${pct}%`;
  const ref = useCountUp<HTMLSpanElement>(label);

  const Box = inline ? "span" : "div";
  return (
    <Box className={className}>
      <BarFill
        pct={pct}
        inline={inline}
        className={trackClassName}
        fillClassName={low ? "bg-status-critical" : "bg-chart-line"}
      />
      <span ref={ref} className={`text-xs shrink-0 ${low ? "text-gray-900" : "text-gray-500"}`}>
        {label}
      </span>
    </Box>
  );
}
