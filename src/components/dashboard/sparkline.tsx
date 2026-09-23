"use client";

import { useRef } from "react";
import { DUR, EASE, STAGGER, dur, gsap, useGSAP } from "@/lib/motion";

type SparklineVariant =
  | "active-contracts"
  | "contracts-at-risk"
  | "portfolio-margin"
  | "on-time-delivery"
  | "revenue-mtd"
  | "portfolio-value";

const PATHS: Record<SparklineVariant, string> = {
  "active-contracts":  "M0,28 C8,20 16,30 28,22 C38,16 50,26 64,18",
  "contracts-at-risk": "M0,22 C8,30 18,18 28,26 C40,16 52,28 64,20",
  "portfolio-margin":  "M0,20 C8,24 18,18 30,26 C42,30 52,26 64,34",
  "on-time-delivery":  "M0,18 C10,22 20,20 32,28 C44,32 54,36 64,40",
  // Revenue builds through the month; portfolio value climbs steadily.
  "revenue-mtd":       "M0,40 C10,38 20,32 32,28 C44,22 54,18 64,12",
  "portfolio-value":   "M0,34 C10,32 20,28 32,26 C44,21 54,18 64,14",
};

interface SparklineProps {
  variant: SparklineVariant;
  /** Position in the strip, so the lines draw in across it rather than at once. */
  index?: number;
}

export default function Sparkline({ variant, index = 0 }: SparklineProps) {
  const path = useRef<SVGPathElement>(null);

  /* The line draws itself left to right, just behind the number it belongs to,
     so the trend reads as something measured rather than a static squiggle.
     Dashing the stroke to its own length and retracting the offset is the only
     way to reveal a curve along its length. */
  useGSAP(() => {
    const el = path.current;
    if (!el) return;
    const length = el.getTotalLength();
    gsap.set(el, { strokeDasharray: length, strokeDashoffset: length });
    gsap.to(el, {
      strokeDashoffset: 0,
      duration: dur(DUR.draw),
      ease: EASE.standard,
      delay: dur(index * STAGGER.cards + 0.2),
    });
  }, []);

  return (
    <svg width="64" height="54" viewBox="0 0 64 54" fill="none">
      <path
        ref={path}
        d={PATHS[variant]}
        stroke="#3b82f6"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
