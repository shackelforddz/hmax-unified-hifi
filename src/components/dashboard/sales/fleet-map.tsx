"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Minus } from "lucide-react";
import WidgetChat from "@/components/dashboard/widget-chat";
import { TabGroup, Select, ALL } from "@/components/dashboard/filter-controls";
import ContractDrawer from "@/components/dashboard/operations/contract-drawer";
import { ALL_PEOPLE } from "@/lib/people-data";
import {
  FLEET_SITES,
  RISK_TYPES,
  carriesRisk,
  contractHealth,
  hasActiveContract,
  hasLeads,
  type FleetSite,
} from "@/lib/fleet-map-data";
import AssetDrawer from "./asset-drawer";
import GoogleFleetMap from "./google-fleet-map";

/** "sales" filters by region, project manager, contracts and leads; "ops"
 *  filters by contract risk type and shows contract detail on each pin. */
export type FleetMapMode = "sales" | "ops";

interface Props {
  /** Omit for the plain map with no filters. */
  mode?: FleetMapMode;
}

const SALES_VIEWS = ["Active contracts", "Potential leads"];
const REGIONS = [...new Set(FLEET_SITES.map((s) => s.region))].sort();
const PROJECT_MANAGERS = [...new Set(FLEET_SITES.flatMap((s) => (s.projectManager ? [s.projectManager] : [])))].sort();
// The ops map is about delivery, so it only shows assets under a delivery contract.
const OPS_SITES = FLEET_SITES.filter((s) => s.contract);

export default function FleetMap({ mode }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [region, setRegion] = useState(ALL);
  const [pm, setPm] = useState(ALL);
  const [view, setView] = useState("all");
  const [risk, setRisk] = useState("all");
  const [assetId, setAssetId] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);

  const salesMatch = (s: FleetSite, v: string) =>
    (region === ALL || s.region === region) &&
    (pm === ALL || s.projectManager === pm) &&
    (v === "all" || (v === "Active contracts" ? hasActiveContract(s) : hasLeads(s)));
  const riskKey = (label: string) => RISK_TYPES.find((r) => r.label === label)?.key;

  const sites = useMemo(() => {
    if (mode === "ops") {
      const key = riskKey(risk);
      return key ? OPS_SITES.filter((s) => carriesRisk(s, key)) : OPS_SITES;
    }
    if (mode === "sales") return FLEET_SITES.filter((s) => salesMatch(s, view));
    return FLEET_SITES;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, region, pm, view, risk]);

  const filters =
    mode === "sales" ? (
      <>
        <Select value={region} onChange={setRegion} allLabel="All regions" options={REGIONS} label="Region" />
        <Select value={pm} onChange={setPm} allLabel="All PMs" options={PROJECT_MANAGERS} label="Project manager" />
        <TabGroup
          value={view}
          onChange={setView}
          options={SALES_VIEWS}
          countFor={(v) => FLEET_SITES.filter((s) => salesMatch(s, v)).length}
          label="Contracts and leads"
        />
      </>
    ) : mode === "ops" ? (
      <TabGroup
        value={risk}
        onChange={setRisk}
        options={RISK_TYPES.map((r) => r.label)}
        countFor={(label) => OPS_SITES.filter((s) => carriesRisk(s, riskKey(label)!)).length}
        label="Risk type"
      />
    ) : null;

  const tip = (site: FleetSite) => (
    <SiteTip
      site={site}
      mode={mode}
      activeRisk={riskKey(risk)}
      onViewAsset={() => setAssetId(site.assetId)}
      onViewContract={() => site.contract && setContractId(site.contract.id)}
    />
  );

  const overlay = filters && (
    <>
      <div className="absolute top-4 left-4 right-16 z-10 flex flex-wrap items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
        {filters}
      </div>
      {sites.length === 0 && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none">
          <p className="text-sm text-gray-500 bg-white/90 rounded-full px-4 py-2 shadow">No assets match these filters.</p>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Drawers are siblings (not children) so the map's touch-none / wheel
          handlers don't intercept scrolling inside them. */}
      <AssetDrawer assetId={assetId} onClose={() => setAssetId(null)} />
      <ContractDrawer contractId={contractId} onClose={() => setContractId(null)} />
      {apiKey ? (
        <GoogleFleetMap apiKey={apiKey} sites={sites} renderTip={tip} overlay={overlay} />
      ) : (
        <StaticFleetMap sites={sites} renderTip={tip} overlay={overlay} tipWidth={mode === "ops" ? 288 : 224} tipHeight={mode === "ops" ? 330 : mode === "sales" ? 200 : 140} />
      )}
    </>
  );
}

/* ── Pin tooltip ─────────────────────────────────────────────────── */
const RISK_LEVEL: Record<string, { label: string; cls: string }> = {
  high: { label: "High", cls: "bg-gray-900 text-white" },
  med: { label: "Med", cls: "bg-gray-200 text-gray-700" },
  low: { label: "Low", cls: "border border-gray-300 text-gray-500" },
};

function HealthBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-chart-line rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500">{pct}%</span>
    </div>
  );
}

function StatusBadge({ critical, label }: { critical: boolean; label: string }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${critical ? "bg-status-critical text-white font-bold" : "border border-gray-300 text-gray-500"}`}>
      {label}
    </span>
  );
}

const tipButton = "flex-1 text-xs rounded-full py-1.5 transition-colors cursor-pointer";

export function SiteTip({
  site,
  mode,
  activeRisk,
  onViewAsset,
  onViewContract,
}: {
  site: FleetSite;
  mode?: FleetMapMode;
  activeRisk?: string;
  onViewAsset: () => void;
  onViewContract: () => void;
}) {
  const c = site.contract;

  if (mode === "ops" && c) {
    const owner = ALL_PEOPLE.find((p) => p.name === c.owner);
    const openAlerts = c.alerts.length;
    return (
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm text-gray-900 leading-snug">{c.name}</p>
            <p className="text-xs text-gray-400 truncate">{c.customer} · {c.value}</p>
          </div>
          <StatusBadge critical={c.status === "critical"} label={c.status === "critical" ? "Critical" : "At risk"} />
        </div>

        <div className="mt-3">
          <p className="text-[11px] text-gray-400 tracking-wider mb-1">Contract health</p>
          <HealthBar pct={contractHealth(c.id)} />
          <p className="text-xs text-gray-400 mt-1">
            {c.progress}% of term elapsed · {openAlerts} open alert{openAlerts === 1 ? "" : "s"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3">
          {RISK_TYPES.map((r) => {
            const level = RISK_LEVEL[c.risk[r.key]];
            return (
              <div key={r.key} className={`flex items-center justify-between gap-2 ${activeRisk && activeRisk !== r.key ? "opacity-50" : ""}`}>
                <span className="text-xs text-gray-600">{r.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${level.cls}`}>{level.label}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-gray-100">
          {owner && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={owner.avatar} alt="" aria-hidden className="w-7 h-7 rounded-full object-cover bg-gray-200 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-xs text-gray-800 truncate">{c.owner}</p>
            <p className="text-[11px] text-gray-400 truncate">Owner · {owner?.role ?? "Project Manager"}</p>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mt-2 truncate">Pin: {site.code} · {site.type}</p>

        <div className="flex gap-2 mt-3">
          <button onClick={onViewContract} className={`${tipButton} bg-gray-900 text-white hover:bg-gray-700`}>View contract</button>
          <button onClick={onViewAsset} className={`${tipButton} text-gray-700 border border-gray-200 hover:border-gray-400`}>View asset</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-gray-900">{site.code}</p>
          <p className="text-xs text-gray-400 truncate">{site.type}</p>
        </div>
        <StatusBadge critical={site.status === "Critical"} label={site.status} />
      </div>
      <p className="text-xs text-gray-400 mt-1">{site.customer} · {site.region}</p>
      <div className="mt-2">
        <HealthBar pct={site.health} />
      </div>
      {mode === "sales" && (
        <div className="flex flex-col gap-0.5 mt-2">
          {site.projectManager && <p className="text-xs text-gray-500">PM: {site.projectManager}</p>}
          <p className="text-xs text-gray-500 truncate">{site.contract ? `Active contract · ${site.contract.name}` : "No active contract"}</p>
          {site.leads.length > 0 && (
            <p className="text-xs text-gray-500 truncate">
              {site.leads.length} open lead{site.leads.length === 1 ? "" : "s"} · {site.leads[0].title}
            </p>
          )}
        </div>
      )}
      <button
        onClick={onViewAsset}
        className="mt-3 w-full text-xs text-gray-700 border border-gray-200 rounded-full py-1.5 hover:border-gray-400 transition-colors cursor-pointer"
      >
        View details
      </button>
    </div>
  );
}

/* ── Static map (no Google Maps key) ─────────────────────────────── */
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

export interface MapProps {
  sites: FleetSite[];
  renderTip: (site: FleetSite) => React.ReactNode;
  overlay?: React.ReactNode;
}

function StaticFleetMap({ sites, renderTip, overlay, tipWidth, tipHeight }: MapProps & { tipWidth: number; tipHeight: number }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<View>({ zoom: 1, panX: 0, panY: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
    setSelectedId(null); // clicking the map background closes the tooltip
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
  const selected = sites.find((s) => s.assetId === selectedId) ?? null;
  const half = tipWidth / 2 + 8;
  const tipX = selected ? clamp((selected.x / 100) * size.w * view.zoom + view.panX, half, size.w - half) : 0;
  const rawY = selected ? (selected.y / 100) * size.h * view.zoom + view.panY : 0;
  // Flip below the pin when the tooltip wouldn't fit above it.
  const tipBelow = rawY < tipHeight + 24;

  return (
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
        {sites.map((m) => (
          <span key={m.assetId} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${m.x}%`, top: `${m.y}%` }}>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setSelectedId((s) => (s === m.assetId ? null : m.assetId)); }}
              className="relative flex items-center justify-center origin-center cursor-pointer"
              style={{ transform: `scale(${1 / view.zoom})` }}
              aria-label={m.code}
            >
              {/* A pinging marker is one raising an alert - it reads red. */}
              {m.ping && <span className="absolute inline-flex h-12 w-12 rounded-full bg-status-critical/30 animate-ping [animation-duration:2.5s]" />}
              <span
                className={`relative inline-flex w-2.5 h-2.5 rounded-full transition-all ${
                  m.ping ? "bg-status-critical" : "bg-gray-900"
                } ${selectedId === m.assetId ? "scale-125" : ""}`}
              />
            </button>
          </span>
        ))}
      </div>

      {overlay}

      {/* Summary tooltip (screen space) */}
      {selected && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className={`absolute z-20 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-100 p-3 animate-message-in ${tipBelow ? "mt-4" : "-translate-y-full -mt-4"}`}
          style={{ left: tipX, top: rawY, width: tipWidth }}
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

      {/* Chat affordance */}
      <div className="absolute top-4 right-4 z-10" onPointerDown={(e) => e.stopPropagation()}>
        <WidgetChat
          title="Fleet map"
          triggerClassName="w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        />
      </div>
    </div>
  );
}
