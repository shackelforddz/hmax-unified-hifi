"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import KpiCard from "./kpi-card";
import { useDetailDrawers } from "./detail-drawers";
import KpiRecords from "./kpi-records";
import { kpiDetail } from "@/lib/kpi-detail";
import type { KpiData } from "@/lib/dashboard-data";

/* Opening is a reveal, so it decelerates into place and takes its time;
   closing is a dismissal, so it accelerates away in a good deal less. Content
   leads on the way in (just behind the opening edge) and leaves first on the
   way out, so text is never legible while the panel collapses through it. */
const EASE_OUT = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const EASE_IN = "cubic-bezier(0.4, 0, 1, 1)";
const OPEN_MS = 340;
const CLOSE_MS = 200;
/* Swapping between KPIs only resizes an panel that is already there, so it
   settles faster than an opening one. */
const SWAP_MS = 240;

type Mode = "open" | "swap";

/* Animating to height:auto isn't possible, so the content is measured and the
   wrapper transitions to that height - which is what slides the dashboard
   below it down and back up. */
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
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  // Measured in a layout effect, not from the ResizeObserver below: the
  // observer fires a frame late, which left the wrapper at the old height for
  // one paint - the new list clipped, or a gap under a shorter one. That frame
  // was the jump when moving between KPIs.
  useLayoutEffect(() => {
    const el = inner.current;
    if (el) setHeight(el.offsetHeight);
  }, [contentKey]);

  // Still observed, for anything that changes size after it has been measured.
  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      aria-hidden={!open}
      style={{
        height: open ? height : 0,
        transitionDuration: `${open ? (mode === "swap" ? SWAP_MS : OPEN_MS) : CLOSE_MS}ms`,
        transitionTimingFunction: open ? EASE_OUT : EASE_IN,
      }}
      className="overflow-hidden transition-[height] motion-reduce:transition-none"
    >
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

  const cols = kpis.length === 3 ? "grid-cols-3" : "grid-cols-4";

  return (
    <div className="flex flex-col">
      <div className={`grid ${cols} gap-4`}>
        {kpis.map((k) => (
          <KpiCard
            key={k.id}
            {...k}
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
