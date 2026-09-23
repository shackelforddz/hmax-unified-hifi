"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import KpiCard from "./kpi-card";
import { useDetailDrawers } from "./detail-drawers";
import KpiRecords from "./kpi-records";
import { kpiDetail } from "@/lib/kpi-detail";
import type { KpiData } from "@/lib/dashboard-data";
import { DUR, EASE, dur, gsap, useGSAP } from "@/lib/motion";

/* Opening is a reveal, so it decelerates into place and takes its time;
   closing is a dismissal, so it accelerates away in a good deal less. Content
   leads on the way in (just behind the opening edge) and leaves first on the
   way out, so text is never legible while the panel collapses through it. */
const EASE_IN = "cubic-bezier(0.4, 0, 1, 1)";
/* How long the panel takes to go, so the records can be unmounted once it has. */
const CLOSE_MS = DUR.fast * 1000;

type Mode = "open" | "swap";

/* The wrapper animates to the height of its content, which is what slides the
   dashboard below it down and back up.

   The height stays an explicit pixel value rather than `auto`: swapping
   straight from one KPI to another has to animate from the height the panel
   currently is, and an `auto` wrapper has already reflowed to the new content
   by the time there is anywhere to read the old height from. */
function Collapse({
  open,
  mode,
  contentKey,
  children,
}: {
  open: boolean;
  mode: Mode;
  /** Changes when the records swap, so the new height is taken before paint. */
  contentKey: string | null;
  children: ReactNode;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  /* What was showing the last time this ran. The panel only travels when that
     has changed; anything else just asserts the height it should be resting
     at - the first paint, where a shut panel must not animate into being shut,
     and Strict Mode's discarded first mount, whose set is reverted underneath
     the second one. */
  // undefined until this has run once; null while nothing is showing.
  const was = useRef<string | null | undefined>(undefined);

  useGSAP(
    () => {
      const w = wrap.current;
      if (!w) return;
      // Read from the content, not the wrapper: the wrapper is the thing being
      // clipped, so its own height is whatever the last tween left behind.
      const target = open ? inner.current?.offsetHeight ?? 0 : 0;
      const showing = open ? contentKey ?? "" : null;

      const moved = was.current !== undefined && was.current !== showing;
      was.current = showing;
      if (!moved) {
        gsap.set(w, { height: target });
        return;
      }

      gsap.to(w, {
        height: target,
        duration: dur(open ? (mode === "swap" ? DUR.base : DUR.slow) : DUR.fast),
        ease: open ? EASE.entrance : EASE.exit,
        // Toggling a card twice in quick succession used to snap: the second
        // transition started from the first's end height rather than from
        // wherever the panel had actually got to. This retargets instead.
        overwrite: "auto",
      });
    },
    { dependencies: [open, mode, contentKey] }
  );

  // Anything that changes size after it has settled - a panel that is resting
  // follows it outright, so it tracks the content rather than lagging a frame.
  useEffect(() => {
    const el = inner.current;
    const w = wrap.current;
    if (!el || !w) return;
    const ro = new ResizeObserver(() => {
      if (gsap.isTweening(w) || w.offsetHeight === 0) return;
      gsap.set(w, { height: el.offsetHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrap} aria-hidden={!open} className="h-0 overflow-hidden">
      <div ref={inner}>{children}</div>
    </div>
  );
}

/* The content parallaxes in just ahead of the opening edge, and leaves before
   the panel collapses through it. Entering is a keyframe (keyed by KPI, so it
   replays when the records swap - the cue that the list has changed); leaving
   is a transition, which is the half that has to be interruptible. */
function Reveal({ show, mode, children }: { show: boolean; mode: Mode; children: ReactNode }) {
  const enter = mode === "swap" ? "animate-records-swap" : "animate-records-in";
  return (
    <div
      style={{
        opacity: show ? 1 : 0,
        transform: show ? "none" : "translateY(-4px)",
        transitionDuration: "110ms",
        transitionTimingFunction: EASE_IN,
      }}
      className={`transition-[opacity,transform] motion-reduce:transition-none ${show ? enter : ""}`}
    >
      {children}
    </div>
  );
}

/** The KPI strip that opens every dashboard. Clicking a card expands the
 *  records behind its number underneath the whole strip, at full width - so
 *  the list has room for real columns and nothing floats over the page. */
export default function KpiStrip({ kpis }: { kpis: KpiData[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  // Kept mounted while the panel collapses, so there is something to animate.
  const [shown, setShown] = useState<KpiData | null>(null);
  // Opening from nothing reads differently from swapping an open panel.
  const [mode, setMode] = useState<Mode>("open");
  const clearTimer = useRef<number | null>(null);

  const stopTimer = () => {
    if (clearTimer.current) window.clearTimeout(clearTimer.current);
    clearTimer.current = null;
  };
  useEffect(() => stopTimer, []);

  const close = useCallback(() => {
    setOpenId(null);
    stopTimer();
    clearTimer.current = window.setTimeout(() => setShown(null), CLOSE_MS);
  }, []);
  const openKpi = (k: KpiData) => {
    stopTimer();
    setMode(openId ? "swap" : "open");
    setShown(k);
    setOpenId(k.id);
  };

  // Escape closes the expanded records - unless a drawer opened from a row is
  // sitting above them, in which case that closes first and the panel stays.
  const drawers = useDetailDrawers();
  const stacked = drawers?.count ?? 0;
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || stacked > 0) return;
      e.stopImmediatePropagation();
      close();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [openId, close, stacked]);

  /* Driven by the room available, not the window: the sheet's width depends on
     the conversation log beside it, so a media query would measure the wrong
     thing. The counts halve rather than auto-fitting, so the strip never ends
     on an orphan card. */
  const cols =
    kpis.length === 3
      ? "grid-cols-3 @max-[660px]:grid-cols-1"
      : "grid-cols-4 @max-[860px]:grid-cols-2 @max-[420px]:grid-cols-1";

  return (
    <div className="flex flex-col">
      <div className={`@container grid ${cols} gap-4`}>
        {kpis.map((k, i) => (
          <KpiCard
            key={k.id}
            {...k}
            index={i}
            selected={openId === k.id}
            onToggle={kpiDetail(k.id) ? () => (openId === k.id ? close() : openKpi(k)) : undefined}
          />
        ))}
      </div>

      <Collapse open={!!openId} mode={mode} contentKey={shown?.id ?? null}>
        {shown && (
          // The gap only exists while there is something below the strip.
          <div className="pt-4">
            <Reveal key={shown.id} show={!!openId} mode={mode}>
              <KpiRecords kpi={shown} onClose={close} />
            </Reveal>
          </div>
        )}
      </Collapse>
    </div>
  );
}
