"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Minus, Search } from "lucide-react";
import WidgetChat, { TRIGGER } from "@/components/dashboard/widget-chat";
import ProgressiveBlur from "@/components/progressive-blur";

/* ── Static map ──────────────────────────────────────────────────────
   The styled city map used when no Google Maps key is configured: pan,
   wheel/button zoom, pins placed by percent coordinates and a tooltip for
   the selected pin. Callers can draw their own layer (e.g. routes) in map
   space and swap the pin artwork. */

export interface MapPin {
  id: string;
  /** Percent coordinates on the map image. */
  x: number;
  y: number;
  label: string;
  /** Raising an alert - the default pin pulses red. */
  ping?: boolean;
}

export interface MapSearch {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

interface View { zoom: number; panX: number; panY: number }

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function clampPan(panX: number, panY: number, zoom: number, w: number, h: number) {
  return { x: clamp(panX, w - w * zoom, 0), y: clamp(panY, h - h * zoom, 0) };
}

// Zoom toward a viewport point (cx, cy), keeping that point fixed.
function zoomAt(v: View, factor: number, cx: number, cy: number, w: number, h: number): View {
  const zoom = clamp(v.zoom * factor, MIN_ZOOM, MAX_ZOOM);
  const contentX = (cx - v.panX) / v.zoom;
  const contentY = (cy - v.panY) / v.zoom;
  const p = clampPan(cx - contentX * zoom, cy - contentY * zoom, zoom, w, h);
  return { zoom, panX: p.x, panY: p.y };
}

export function DefaultPin({ pin, selected }: { pin: MapPin; selected: boolean }) {
  return (
    <>
      {/* A pinging marker is one raising an alert - it reads red. */}
      {pin.ping && <span className="absolute inline-flex h-12 w-12 rounded-full bg-status-critical/30 animate-ping [animation-duration:2.5s]" />}
      <span
        className={`relative inline-flex w-2.5 h-2.5 rounded-full transition-all ${pin.ping ? "bg-status-critical" : "bg-gray-900"} ${
          selected ? "scale-125" : ""
        }`}
      />
    </>
  );
}

interface Props<P extends MapPin> {
  pins: P[];
  renderTip: (pin: P) => React.ReactNode;
  /** Screen-space controls drawn over the map (filters, panels). */
  overlay?: React.ReactNode;
  /** Drawn in map space under the pins - use a 0-100 viewBox SVG. */
  layer?: React.ReactNode;
  /** Custom pin artwork. */
  renderPin?: (pin: P, selected: boolean) => React.ReactNode;
  tipWidth: number;
  /** Rough tooltip height, used until the open tooltip has been measured. */
  tipHeight: number;
  /** Search box in the title band, filtering the pins the caller passes. */
  search?: MapSearch;
  /** Overrides the tooltip card's radius, border and padding for a pin. */
  tipClassName?: (pin: P) => string | undefined;
  /** Controlled selection; omit to let the map manage it. */
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  title?: string;
}

export default function StaticMap<P extends MapPin>({
  pins,
  renderTip,
  overlay,
  layer,
  renderPin,
  tipWidth,
  tipHeight,
  selectedId: controlledId,
  onSelect,
  tipClassName,
  search,
  title = "Risk Map",
}: Props<P>) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<View>({ zoom: 1, panX: 0, panY: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const [ownId, setOwnId] = useState<string | null>(null);
  const selectedId = controlledId !== undefined ? controlledId : ownId;
  const select = (id: string | null) => (onSelect ? onSelect(id) : setOwnId(id));
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  // Track viewport size for tooltip positioning + pan clamping.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Native wheel listener (non-passive so we can preventDefault the page scroll).
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      setView((v) => zoomAt(v, factor, e.clientX - rect.left, e.clientY - rect.top, size.w, size.h));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [size.w, size.h]);

  const zoomBtn = (dir: 1 | -1) =>
    setView((v) => zoomAt(v, dir > 0 ? 1.4 : 1 / 1.4, size.w / 2, size.h / 2, size.w, size.h));

  const onPointerDown = (e: React.PointerEvent) => {
    select(null); // clicking the map background closes the tooltip
    if (viewRef.current.zoom <= 1) return;
    drag.current = { x: e.clientX, y: e.clientY, panX: view.panX, panY: view.panY };
    viewportRef.current?.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const p = clampPan(drag.current.panX + (e.clientX - drag.current.x), drag.current.panY + (e.clientY - drag.current.y), viewRef.current.zoom, size.w, size.h);
    setView((v) => ({ ...v, panX: p.x, panY: p.y }));
  };
  const onPointerUp = () => { drag.current = null; };

  // A pin filtered off the map takes its tooltip with it.
  const selected = pins.find((p) => p.id === selectedId) ?? null;
  const half = tipWidth / 2 + 8;
  const tipX = selected ? clamp((selected.x / 100) * size.w * view.zoom + view.panX, half, size.w - half) : 0;
  const rawY = selected ? (selected.y / 100) * size.h * view.zoom + view.panY : 0;
  // Measure the open tooltip so it can be kept inside the map.
  const [tipEl, setTipEl] = useState<HTMLDivElement | null>(null);
  const [measuredTipH, setMeasuredTipH] = useState(0);
  useEffect(() => {
    if (!tipEl) return;
    const ro = new ResizeObserver(() => setMeasuredTipH(tipEl.offsetHeight));
    ro.observe(tipEl);
    return () => ro.disconnect();
  }, [tipEl]);
  const tipH = measuredTipH || tipHeight;
  // Above the pin when it fits, otherwise below; either way clamped so a tall
  // tooltip never runs off the map.
  const GAP = 16;
  const preferred = rawY - GAP - tipH >= 8 ? rawY - GAP - tipH : rawY + GAP;
  const tipTop = clamp(preferred, 8, Math.max(8, size.h - tipH - 8));

  return (
    <div
      ref={viewportRef}
      className="@container relative rounded-xl overflow-hidden border border-gray-200 h-full min-h-[420px] bg-gray-100 select-none touch-none"
      style={{ cursor: view.zoom > 1 ? (drag.current ? "grabbing" : "grab") : "default" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* Transformed map layer */}
      <div className="absolute inset-0 origin-top-left will-change-transform" style={{ transform: `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})` }}>
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/milan-map.png)" }} />
        {layer}
        {pins.map((m) => (
          <span key={m.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${m.x}%`, top: `${m.y}%` }}>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); select(selectedId === m.id ? null : m.id); }}
              className="relative flex items-center justify-center origin-center cursor-pointer"
              style={{ transform: `scale(${1 / view.zoom})` }}
              aria-label={m.label}
            >
              {/* A caller can style some pins and leave the rest to the default. */}
              {renderPin?.(m, selectedId === m.id) ?? <DefaultPin pin={m} selected={selectedId === m.id} />}
            </button>
          </span>
        ))}
      </div>

      {/* Title band - the map blurs and fades out beneath it */}
      <div className="absolute top-0 inset-x-0 z-10 px-4 py-3.5">
        <ProgressiveBlur className="rounded-t-xl" />
        <div className="absolute inset-0 rounded-t-xl bg-gradient-to-b from-[#faf5ed] to-[#faf5ed]/0 pointer-events-none" />
        <div className="relative flex items-start justify-between gap-3">
          <h3 className="text-base text-gray-900 shrink-0">{title}</h3>
          <span className="flex-1" />
          <WidgetChat
            title={title}
            triggerClassName={`${TRIGGER} -mt-1 -mr-1`}
          />
        </div>
      </div>

      {/* Search sits on the map itself, beside the filters */}
      {search && (
        <div
          className="absolute top-14 right-4 z-10 flex items-center gap-1.5 h-8 w-[200px] @max-[620px]:hidden px-2.5 bg-white border border-gray-200 rounded-full shadow-sm"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <input
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder}
            aria-label={`Search the ${title.toLowerCase()}`}
            className="flex-1 min-w-0 text-sm text-gray-700 placeholder-gray-500 outline-none bg-transparent"
          />
          <Search size={15} strokeWidth={1.5} className="text-gray-500 shrink-0" />
        </div>
      )}

      {overlay}

      {/* Summary tooltip (screen space) */}
      {selected && (
        <div
          ref={setTipEl}
          onPointerDown={(e) => e.stopPropagation()}
          className={`absolute z-20 -translate-x-1/2 bg-white shadow-xl border animate-message-in max-h-[calc(100%-16px)] overflow-y-auto no-scrollbar ${
            tipClassName?.(selected) ?? "rounded-xl border-gray-100 p-3"
          }`}
          style={{ left: tipX, top: tipTop, width: tipWidth }}
        >
          {renderTip(selected)}
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-10" onPointerDown={(e) => e.stopPropagation()}>
        <button onClick={() => zoomBtn(1)} aria-label="Zoom in" className="w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-gray-600 hover:text-gray-900 shadow cursor-pointer">
          <Plus size={15} strokeWidth={2} />
        </button>
        <button onClick={() => zoomBtn(-1)} aria-label="Zoom out" className="w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-gray-600 hover:text-gray-900 shadow cursor-pointer">
          <Minus size={15} strokeWidth={2} />
        </button>
      </div>

    </div>
  );
}
