/* ── The motion layer ────────────────────────────────────────────────
   GSAP handles the four things CSS structurally cannot: animating a CSS-grid
   reorder (Flip), sequences that have to be cancellable mid-flight, tweening
   to height:auto without measuring, and anything where several elements share
   one clock. Everything else in this app stays in globals.css, on the
   compositor, where it belongs - see the keyframes there.

   Nothing here runs on the server. GSAP writes inline styles frame by frame,
   which means the `prefers-reduced-motion` block in globals.css does not touch
   it: that rule collapses CSS animation only. So every duration in a GSAP
   tween goes through `dur()`, which returns 0 when the user has asked for less
   motion. A zero-duration tween still applies its end values, so the result is
   the finished state with no travel - which is the correct behaviour, not a
   disabled feature. */

import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";

// useGSAP is registered as a plugin so GSAP knows to route its cleanup through
// React's effect lifecycle; Flip is what animates the bento grid.
gsap.registerPlugin(useGSAP, Flip);

/* The CSS eases in globals.css, as their GSAP equivalents. Close enough that
   the two systems never read as different hands, and near enough to free that
   pulling in CustomEase isn't worth the bytes.
     --ease-entrance  cubic-bezier(0.2, 0.8, 0.2, 1)  ->  power3.out
     --ease-exit      cubic-bezier(0.4, 0, 1, 1)      ->  power2.in
     --ease-standard  cubic-bezier(0.4, 0, 0.2, 1)    ->  power2.inOut */
export const EASE = {
  /** Arriving: decelerates into place. */
  entrance: "power3.out",
  /** Leaving: accelerates away. */
  exit: "power2.in",
  /** Moving between two states that both exist. */
  standard: "power2.inOut",
} as const;

/** Every duration in one place, in seconds. */
export const DUR = {
  /** A control acknowledging a press. */
  micro: 0.14,
  /** Something small leaving. */
  fast: 0.2,
  /** The house default. */
  base: 0.24,
  /** Something arriving that the eye should follow. */
  slow: 0.32,
  /** A panel taking over the right-hand side. */
  drawerIn: 0.38,
  drawerOut: 0.26,
  /** A widget travelling across the grid to a new slot. */
  flip: 0.45,
  /** A number counting up to its value. */
  count: 0.9,
  /** A line drawing itself in. */
  draw: 0.7,
} as const;

/** How far apart the members of a list arrive, in seconds. */
export const STAGGER = {
  /** Rows in a table. */
  rows: 0.03,
  /** Cards in a strip. */
  cards: 0.06,
  /** Widgets settling after a reorder. */
  grid: 0.02,
} as const;

let query: MediaQueryList | null = null;

/** Has the user asked for less motion? */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  query ??= window.matchMedia("(prefers-reduced-motion: reduce)");
  return query.matches;
}

/** A duration, or 0 when the user wants no motion - so the tween still lands
 *  on its end values, it just doesn't travel to get there. Wrap every
 *  duration, delay and stagger a GSAP tween is given. */
export function dur(seconds: number): number {
  return prefersReducedMotion() ? 0 : seconds;
}

/* ── Counting a written number up to itself ──────────────────────────
   KPI values are authored the way they should read - "12", "€2.4m", "94%" -
   so counting one up means taking it apart and putting it back together each
   frame, rather than asking every caller to supply a number and a formatter. */

export interface NumericParts {
  prefix: string;
  suffix: string;
  value: number;
  decimals: number;
  /** The digits were grouped ("1,240"), so they are grouped on the way up too. */
  grouped: boolean;
}

/** Pulls the number out of a written value, or null if there isn't one. */
export function parseNumeric(text: string): NumericParts | null {
  const m = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(text.trim());
  if (!m) return null;
  const [, prefix, digits, suffix] = m;
  const plain = digits.replace(/,/g, "");
  const value = Number(plain);
  if (!Number.isFinite(value)) return null;
  const dot = plain.indexOf(".");
  return {
    prefix,
    suffix,
    value,
    decimals: dot === -1 ? 0 : plain.length - dot - 1,
    grouped: digits.includes(","),
  };
}

/** Writes a number back the way the original was written. */
export function formatNumeric(n: number, p: NumericParts): string {
  const fixed = n.toFixed(p.decimals);
  const body = p.grouped
    ? Number(fixed).toLocaleString("en-US", {
        minimumFractionDigits: p.decimals,
        maximumFractionDigits: p.decimals,
      })
    : fixed;
  return `${p.prefix}${body}${p.suffix}`;
}

export { gsap, Flip, useGSAP };
