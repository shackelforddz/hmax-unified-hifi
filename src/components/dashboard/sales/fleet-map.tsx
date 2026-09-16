"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Minus } from "lucide-react";
import { MAP_MARKERS, ASSET_DETAILS } from "@/lib/sales-data";
import WidgetChat from "@/components/dashboard/widget-chat";
import AssetDrawer from "./asset-drawer";
import GoogleFleetMap from "./google-fleet-map";

// Use Google Maps when an API key is configured; otherwise the styled map below.
export default function FleetMap() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  return apiKey ? <GoogleFleetMap apiKey={apiKey} /> : <StaticFleetMap />;
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

function StaticFleetMap() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<View>({ zoom: 1, panX: 0, panY: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const [selected, setSelected] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
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
    setSelected(null); // clicking the map background closes the tooltip
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

  const asset = selected ? ASSET_DETAILS[selected] : null;
  const marker = MAP_MARKERS.find((m) => m.id === selected);
  const tipX = marker ? clamp((marker.x / 100) * size.w * view.zoom + view.panX, 116, size.w - 116) : 0;
  const rawY = marker ? (marker.y / 100) * size.h * view.zoom + view.panY : 0;
  const tipBelow = rawY < 150; // not enough room above - flip below the marker

  return (
    <>
      {/* Drawer is a sibling (not a child) so the map's touch-none / wheel
          handlers don't intercept scrolling inside it. */}
      <AssetDrawer assetId={drawerId} onClose={() => setDrawerId(null)} />
      <div
        ref={viewportRef}
        className="relative rounded-xl overflow-hidden border border-gray-200 h-full min-h-[420px] bg-gray-100 select-none touch-none"
        style={{ cursor: view.zoom > 1 ? (drag.current ? "grabbing" : "grab") : "default" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
      {/* Transformed map layer */}
      <div className="absolute inset-0 origin-top-left will-change-transform" style={{ transform: `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})` }}>
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/milan-map.png)" }} />
        {MAP_MARKERS.map((m) => (
          <span key={m.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${m.x}%`, top: `${m.y}%` }}>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setSelected((s) => (s === m.id ? null : m.id)); }}
              className="relative flex items-center justify-center origin-center cursor-pointer"
              style={{ transform: `scale(${1 / view.zoom})` }}
              aria-label={m.id.replace("ast-", "AST-")}
            >
              {/* A pinging marker is one raising an alert - it reads red. */}
              {m.ping && <span className="absolute inline-flex h-12 w-12 rounded-full bg-status-critical/30 animate-ping [animation-duration:2.5s]" />}
              <span
                className={`relative inline-flex w-2.5 h-2.5 rounded-full transition-all ${
                  m.ping ? "bg-status-critical" : "bg-gray-900"
                } ${selected === m.id ? "scale-125" : ""}`}
              />
            </button>
          </span>
        ))}
      </div>

      {/* Summary tooltip (screen space) */}
      {asset && marker && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className={`absolute z-10 w-56 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-100 p-3 animate-message-in ${tipBelow ? "mt-4" : "-translate-y-full -mt-4"}`}
          style={{ left: tipX, top: rawY }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm text-gray-900">{asset.code}</p>
              <p className="text-xs text-gray-400 truncate">{asset.type}</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${asset.stats.status === "Critical" ? "bg-status-critical text-white font-bold" : "border border-gray-300 text-gray-500"}`}>{asset.stats.status}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{asset.location}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-chart-line rounded-full" style={{ width: `${asset.stats.healthPct}%` }} />
            </div>
            <span className="text-xs text-gray-500">{asset.stats.healthPct}%</span>
          </div>
          <button
            onClick={() => setDrawerId(selected)}
            className="mt-3 w-full text-xs text-gray-700 border border-gray-200 rounded-full py-1.5 hover:border-gray-400 transition-colors cursor-pointer"
          >
            View details
          </button>
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

      {/* Chat affordance */}
      <div className="absolute top-4 right-4 z-10" onPointerDown={(e) => e.stopPropagation()}>
        <WidgetChat
          title="Fleet map"
          triggerClassName="w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        />
      </div>
      </div>
    </>
  );
}
