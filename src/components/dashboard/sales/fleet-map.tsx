"use client";

import { useMemo, useState } from "react";
import StaticMap from "@/components/dashboard/static-map";
import { TabGroup, Select, ALL } from "@/components/dashboard/filter-controls";
import ContractDrawer from "@/components/dashboard/operations/contract-drawer";
import { ALL_PEOPLE } from "@/lib/people-data";
import { ASSET_ALERTS, ASSET_CATEGORY_LABELS, OPPORTUNITIES, leadDetail, type AssetAlert, type AssetCategory } from "@/lib/sales-data";
import {
  FLEET_SITES,
  UNCOVERED_SITES,
  LEAD_SITES,
  RISK_TYPES,
  carriesRisk,
  contractHealth,
  type LeadSite,
  type FleetSite,
} from "@/lib/fleet-map-data";
import AssetDrawer from "./asset-drawer";
import OpportunityDrawer from "./opportunity-drawer";
import GoogleFleetMap from "./google-fleet-map";

/** "sales" filters by region, project manager, contracts and leads; "ops"
 *  filters by contract risk type and shows contract detail on each pin;
 *  "alerts" filters by the role's own asset alert categories. */
export type FleetMapMode = "sales" | "ops" | "alerts";

interface Props {
  /** Omit for the plain map with no filters. */
  mode?: FleetMapMode;
  /** For "alerts": the role's asset alerts and their category labels. */
  alerts?: AssetAlert[];
  categoryOptions?: { label: string; value: AssetCategory | "all" }[];
}

/** The sales map shows the assets, the agreements covering them, or the
 *  open leads against them. */
const SALES_LAYERS = ["Renewals", "Leads", "Assets"];
const LEAD_REGIONS = [...new Set(LEAD_SITES.map((l) => l.region))].sort();
/* The three layers mirror the sales dashboard's alert lists: renewals that
   need attention, new leads that need attention, and the asset alerts. */
const RENEWAL_SITES = LEAD_SITES.filter((l) => l.category === "Renewal");
const NEW_LEAD_SITES = LEAD_SITES.filter((l) => l.category === "New lead");
const ALERT_SITES = FLEET_SITES.filter((s) => ASSET_ALERTS.some((a) => a.id === s.assetId && a.alert));
const UNCOVERED_IDS = new Set(UNCOVERED_SITES.map((s) => s.assetId));

const REGIONS = [...new Set(FLEET_SITES.map((s) => s.region))].sort();
// The ops map is about delivery, so it only shows assets under a delivery contract.
const OPS_SITES = FLEET_SITES.filter((s) => s.contract);

export default function FleetMap({ mode, alerts = [], categoryOptions = [] }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [region, setRegion] = useState(ALL);
  const [risk, setRisk] = useState("all");
  const [query, setQuery] = useState("");
  const [assetId, setAssetId] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const [layer, setLayer] = useState("Renewals");
  const [lead, setLead] = useState<LeadSite | null>(null);
  const showingRenewals = mode === "sales" && layer === "Renewals";
  const showingLeads = mode === "sales" && layer === "Leads";

  const riskKey = (label: string) => RISK_TYPES.find((r) => r.label === label)?.key;

  // Alerts view: each pin's alert, and the category tabs that filter them.
  const [category, setCategory] = useState("all");
  const alertFor = (s: FleetSite) => alerts.find((a) => a.id === s.assetId && a.alert);
  const categoryLabel = (c: AssetCategory) => categoryOptions.find((o) => o.value === c)?.label ?? ASSET_CATEGORY_LABELS[c] ?? c;
  const alertCategories = categoryOptions.filter((o) => o.value !== "all").map((o) => o.label);
  const inCategory = (s: FleetSite, label: string) => {
    const a = alertFor(s);
    return !!a && categoryLabel(a.category) === label;
  };

  const matchesQuery = (s: FleetSite) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [s.code, s.type, s.customer, s.region, s.contract?.name, s.projectManager]
      .some((v) => v?.toLowerCase().includes(q));
  };

  // Contracts view: one pin per agreement, plus the assets none of them cover.
  // Renewals and new leads are the same shape - only the list differs.
  const leads = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = showingRenewals ? RENEWAL_SITES : NEW_LEAD_SITES;
    return list.filter(
      (l) =>
        (region === ALL || l.region === region) &&
        (!q || [l.title, l.account, l.owner, l.stage, ...l.assets].some((v) => v.toLowerCase().includes(q)))
    );
  }, [region, query, showingRenewals]);

  // Assets view: the same alerting assets the Asset Alerts list carries.
  const alerting = useMemo(
    () => ALERT_SITES.filter((s) => (region === ALL || s.region === region) && matchesQuery(s)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [region, query]
  );

  const sites = useMemo(() => {
    const search = (list: FleetSite[]) => list.filter(matchesQuery);
    if (mode === "ops") {
      const key = riskKey(risk);
      return search(key ? OPS_SITES.filter((s) => carriesRisk(s, key)) : OPS_SITES);
    }
    if (mode === "sales") return layer === "Assets" ? alerting : [];
    if (mode === "alerts" && category !== "all") return search(FLEET_SITES.filter((s) => inCategory(s, category)));
    return search(FLEET_SITES);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, region, risk, category, alerts, query, layer, alerting]);

  const layerTabs = mode === "sales" && (
    <div role="tablist" aria-label="Map layer" className="bg-gray-100 h-8 flex items-center p-[3px] rounded-full shrink-0">
      {SALES_LAYERS.map((l) => (
        <button
          key={l}
          role="tab"
          aria-selected={layer === l}
          onClick={() => {
            setLayer(l);
            setRegion(ALL);
          }}
          className={`h-full px-3 rounded-full text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
            layer === l ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );

  const filters =
    mode === "sales" ? (
      <>
        {layerTabs}
        <Select
          value={region}
          onChange={setRegion}
          allLabel="All regions"
          options={layer === "Assets" ? REGIONS : LEAD_REGIONS}
          label="Region"
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
    ) : mode === "alerts" ? (
      <TabGroup
        value={category}
        onChange={setCategory}
        options={alertCategories}
        countFor={(label) => FLEET_SITES.filter((s) => inCategory(s, label)).length}
        label="Risk category"
      />
    ) : null;

  const tip = (site: FleetSite) => (
    <SiteTip
      site={site}
      mode={mode}
      activeRisk={riskKey(risk)}
      alert={mode === "alerts" ? alertFor(site) : mode === "sales" ? ASSET_ALERTS.find((a) => a.id === site.assetId) : undefined}
      alertLabel={categoryLabel}
      uncovered={mode === "sales" && UNCOVERED_IDS.has(site.assetId)}
      onViewAsset={() => setAssetId(site.assetId)}
      onViewContract={() => site.contract && setContractId(site.contract.id)}
    />
  );

  const leadTip = (l: LeadSite) => <LeadTip lead={l} onViewDetails={() => setLead(l)} />;

  const overlay = filters && (
    <>
      <div className="absolute top-14 left-4 right-[224px] z-10 flex flex-wrap items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
        {filters}
      </div>
      {sites.length === 0 && (mode === "sales" && layer !== "Assets" ? leads.length === 0 : true) && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none">
          <p className="text-sm text-gray-500 bg-white/90 rounded-full px-4 py-2 shadow">
            {showingRenewals
              ? "No renewals need attention here."
              : showingLeads
              ? "No new leads need attention here."
              : "No asset alerts match this search or region."}
          </p>
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
      <OpportunityDrawer
        opp={lead ? OPPORTUNITIES.find((o) => o.id === lead.id) ?? null : null}
        detail={lead ? leadDetail(OPPORTUNITIES.find((o) => o.id === lead.id)!) : null}
        onClose={() => setLead(null)}
      />
      {apiKey ? (
        <GoogleFleetMap
          apiKey={apiKey}
          sites={sites}
          renderTip={tip}
          overlay={overlay}
          title="Risk Map"
          search={{ value: query, onChange: setQuery, placeholder: "Search assets" }}
        />
      ) : (
        <StaticMap
          title="Risk Map"
          search={{
            value: query,
            onChange: setQuery,
            placeholder: showingRenewals ? "Search renewals" : showingLeads ? "Search leads" : "Search assets",
          }}
          pins={[
            ...(mode === "sales" && layer !== "Assets"
              ? leads.map((l) => ({ id: `lead:${l.id}`, x: l.x, y: l.y, label: l.title, lead: l, site: undefined }))
              : []),
            ...sites.map((site) => ({ id: site.assetId, x: site.x, y: site.y, ping: site.ping, label: site.code, site, lead: undefined })),
          ]}
          renderTip={(pin) => (pin.lead ? leadTip(pin.lead) : pin.site ? tip(pin.site) : null)}
          renderPin={(pin, selected) => {
            if (pin.lead) {
              return (
                <span
                  className={`relative size-3.5 rotate-45 bg-chart-line border-2 border-white shadow transition-transform ${selected ? "scale-125" : ""}`}
                />
              );
            }
            // On the assets layer every pin is an alert - critical ones pulse.
            const alert = mode === "sales" && pin.site ? ASSET_ALERTS.find((a) => a.id === pin.site!.assetId) : undefined;
            if (!alert) return undefined;
            const critical = alert.status === "critical";
            return (
              <>
                {critical && <span className="absolute inline-flex h-12 w-12 rounded-full bg-status-critical/30 animate-ping [animation-duration:2.5s]" />}
                <span
                  className={`relative inline-flex size-3 rounded-full border-2 border-white shadow transition-transform ${
                    critical ? "bg-status-critical" : "bg-status-warning"
                  } ${selected ? "scale-125" : ""}`}
                />
              </>
            );
          }}
          overlay={overlay}
          tipWidth={mode === "ops" ? 288 : 224}
          tipHeight={mode === "ops" ? 360 : mode === "sales" || mode === "alerts" ? 210 : 140}
        />
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
  alert,
  alertLabel,
  uncovered,
  onViewAsset,
  onViewContract,
}: {
  site: FleetSite;
  mode?: FleetMapMode;
  activeRisk?: string;
  alert?: AssetAlert;
  alertLabel?: (c: AssetCategory) => string;
  /** Shown in the contracts view: no agreement covers this asset. */
  uncovered?: boolean;
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
            <p className="text-sm font-bold text-gray-900 leading-snug">{c.name}</p>
            <p className="text-xs text-gray-400 truncate">{c.customer} · {c.value}</p>
          </div>
          <StatusBadge critical={c.status === "critical"} label={c.status === "critical" ? "Critical" : "At risk"} />
        </div>

        <div className="mt-3">
          <p className="text-[11px] text-gray-400 tracking-wider mb-1">Contract health</p>
          <HealthBar pct={contractHealth(c.id)} />
          <p className="text-[11px] text-gray-400 tracking-wider mt-2 mb-1">Asset health · {site.code}</p>
          <HealthBar pct={site.health} />
          <p className="text-xs text-gray-400 mt-1">
            {openAlerts} open alert{openAlerts === 1 ? "" : "s"} on the contract
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
          <p className="text-sm font-bold text-gray-900">{site.code}</p>
          <p className="text-xs text-gray-400 truncate">{site.type}</p>
        </div>
        <StatusBadge critical={site.status === "Critical"} label={site.status} />
      </div>
      <p className="text-xs text-gray-400 mt-1">{site.customer} · {site.region}</p>
      {uncovered && <p className="mt-2 text-xs text-status-critical font-bold">No service agreement covers this asset</p>}
      <div className="mt-2">
        <p className="text-[11px] text-gray-400 tracking-wider mb-1">Asset health</p>
        <HealthBar pct={site.health} />
      </div>
      {alert?.alert && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{alertLabel?.(alert.category) ?? alert.category}</span>
          <p className="text-xs text-gray-800 leading-snug mt-1.5">{alert.alert.title}</p>
          {alert.alert.impact && <p className="text-xs text-gray-400 mt-0.5">{alert.alert.impact}</p>}
        </div>
      )}
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

/* ── Lead tooltip (leads view) ───────────────────────────────────── */
export function LeadTip({ lead, onViewDetails }: { lead: LeadSite; onViewDetails: () => void }) {
  const label = lead.status === "stalled" ? "Stalled" : lead.status === "at-risk" ? "At risk" : "On track";
  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-snug">{lead.title}</p>
          <p className="text-xs text-gray-400 truncate">
            {lead.account} · {lead.value}
          </p>
        </div>
        <StatusBadge critical={lead.status === "stalled"} label={label} />
      </div>
      <div className="flex flex-col gap-0.5 mt-2">
        <p className="text-xs text-gray-500">
          {lead.stage} · {lead.winConfidence}% win confidence
        </p>
        <p className="text-xs text-gray-500">
          {lead.owner} · {lead.region}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {lead.assets.length > 0 ? `Assets in scope: ${lead.assets.join(", ")}` : "No assets scoped yet"}
        </p>
        {lead.attention.length > 0 && (
          <p className="text-xs text-status-critical font-bold">
            {lead.attention.length} needing attention: {lead.attention.join(", ")}
          </p>
        )}
      </div>
      <button
        onClick={onViewDetails}
        className="mt-3 w-full text-xs text-gray-700 border border-gray-200 rounded-full py-1.5 hover:border-gray-400 transition-colors cursor-pointer"
      >
        View details
      </button>
    </div>
  );
}

export interface MapProps {
  sites: FleetSite[];
  renderTip: (site: FleetSite) => React.ReactNode;
  overlay?: React.ReactNode;
}
