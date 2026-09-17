import { OPPORTUNITIES, OPPORTUNITY_DETAILS, SLA_CONTRACTS } from "@/lib/sales-data";
import { OPS_CONTRACTS, OPS_CONTRACT_DETAILS, type OpsContract, type RiskLevel, type RiskProfile } from "@/lib/operations-data";
import { getAssetDetail, resolveAssetId } from "@/lib/asset-lookup";

/* ── Fleet map sites ─────────────────────────────────────────────────
   One pin per monitored asset, joined to the contracts and leads that
   touch it so the map can be filtered by who and what it's tied to. */

export interface FleetSite {
  assetId: string;
  code: string;
  type: string;
  customer: string;
  region: string;
  health: number;
  status: string;
  /** x/y are percent coords for the static map; lat/lng for Google Maps. */
  x: number;
  y: number;
  lat: number;
  lng: number;
  /** Raising an alert - the pin pulses red. */
  ping?: boolean;
  /** The delivery contract covering the asset, if any. */
  contract?: OpsContract;
  /** Its project manager - the owner of that delivery contract. */
  projectManager?: string;
  /** Open leads that name the asset. */
  leads: { id: string; title: string; stage: string; value: string }[];
}

const PINS: { id: string; region: string; x: number; y: number; lat: number; lng: number; ping?: boolean }[] = [
  { id: "ast-001", region: "Midwest · US", x: 52, y: 24, lat: 45.508, lng: 9.162, ping: true },
  { id: "ast-002", region: "Midwest · US", x: 33, y: 66, lat: 45.432, lng: 9.112 },
  { id: "ast-003", region: "West · US", x: 68, y: 46, lat: 45.462, lng: 9.252 },
  { id: "ast-004", region: "Midwest · US", x: 23, y: 39, lat: 45.421, lng: 9.148 },
  { id: "ast-014", region: "Midwest · US", x: 60, y: 31, lat: 45.495, lng: 9.205 },
  { id: "ast-019", region: "Midwest · US", x: 45, y: 36, lat: 45.483, lng: 9.176 },
  { id: "ast-021", region: "North Sea", x: 76, y: 70, lat: 45.418, lng: 9.262 },
  { id: "ast-022", region: "North Sea", x: 83, y: 57, lat: 45.442, lng: 9.281 },
  { id: "ast-031", region: "North Sea", x: 17, y: 20, lat: 45.518, lng: 9.071 },
  { id: "ast-032", region: "North Sea", x: 29, y: 13, lat: 45.531, lng: 9.098 },
  { id: "ast-033", region: "Southeast · US", x: 60, y: 83, lat: 45.395, lng: 9.214 },
  { id: "ast-041", region: "West · US", x: 42, y: 57, lat: 45.447, lng: 9.171 },
  // Monitored, with no contract behind them.
  { id: "ast-051", region: "Midwest · US", x: 36, y: 20, lat: 45.512, lng: 9.128, ping: true },
  { id: "ast-052", region: "Midwest · US", x: 53, y: 66, lat: 45.436, lng: 9.192 },
];

function buildSites(): FleetSite[] {
  return PINS.flatMap((pin) => {
    const d = getAssetDetail(pin.id);
    if (!d) return [];
    const contract = OPS_CONTRACTS.find((c) => OPS_CONTRACT_DETAILS[c.id]?.assets.some((a) => a.code === d.code));
    const leads = OPPORTUNITIES.filter((o) =>
      OPPORTUNITY_DETAILS[o.id]?.assets.some((a) => resolveAssetId(a.code) === pin.id)
    ).map((o) => ({ id: o.id, title: o.title, stage: o.stage, value: o.value }));
    return [
      {
        ...pin,
        assetId: pin.id,
        code: d.code,
        type: d.type,
        customer: d.related.customer,
        health: d.stats.healthPct,
        status: d.stats.status,
        contract,
        projectManager: contract?.owner,
        leads,
      },
    ];
  });
}

export const FLEET_SITES: FleetSite[] = buildSites();

/** Needs attention: raising an alert, not in service, or condition under 60. */
export const needsAttention = (s: FleetSite) => !!s.ping || s.status !== "In service" || s.health < 60;

/* ── Ops view: risk types ── */
export const RISK_TYPES: { key: keyof RiskProfile; label: string }[] = [
  { key: "schedule", label: "Schedule" },
  { key: "cost", label: "Cost" },
  { key: "quality", label: "Quality" },
  { key: "safety", label: "Safety" },
];

/** A site carries a risk type when its contract rates it medium or high. */
export const carriesRisk = (s: FleetSite, key: keyof RiskProfile) =>
  !!s.contract && (["med", "high"] as RiskLevel[]).includes(s.contract.risk[key]);

/** A contract's health: the average condition of the assets it covers. */
export function contractHealth(contractId: string): number {
  const assets = OPS_CONTRACT_DETAILS[contractId]?.assets ?? [];
  return assets.length ? Math.round(assets.reduce((sum, a) => sum + a.health, 0) / assets.length) : 0;
}

/* ── Service agreements ──────────────────────────────────────────────
   The sales map can show contracts instead of assets: one pin per service
   agreement, placed over the assets it covers. */

export interface ContractSite {
  /** Covered assets needing attention. */
  attention?: string[];
  id: string;
  agreement: string;
  account: string;
  value: string;
  region: string;
  owner: string;
  risk: string;
  renewsIn: string;
  slaActual: string;
  slaTarget: string;
  /** Asset codes the agreement covers. */
  assets: string[];
  x: number;
  y: number;
}

export const CONTRACT_SITES: (ContractSite & { attention: string[] })[] = Object.entries(SLA_CONTRACTS).map(([id, c], i) => {
  const covered = FLEET_SITES.filter((s) => c.assets.some((a) => a.code === s.code));
  // Over the assets it covers, or spread across the map when none are mapped.
  const x = covered.length ? covered.reduce((sum, s) => sum + s.x, 0) / covered.length : 18 + i * 12;
  const y = covered.length ? covered.reduce((sum, s) => sum + s.y, 0) / covered.length : 86;
  return {
    id,
    agreement: c.agreement,
    account: c.account,
    value: c.value,
    region: c.region,
    owner: c.owner,
    risk: c.risk.label,
    renewsIn: c.renewsIn,
    slaActual: c.slaActual,
    slaTarget: c.slaTarget,
    assets: c.assets.map((a) => a.code),
    attention: covered.filter(needsAttention).map((s) => s.code),
    x: Math.round(x),
    y: Math.round(y),
  };
});

/** Assets no contract of any kind covers - neither an agreement nor a
 *  delivery contract. */
export const UNCOVERED_SITES = FLEET_SITES.filter(
  (s) => !s.contract && !CONTRACT_SITES.some((c) => c.assets.includes(s.code))
);

/* ── Renewals and new leads ──────────────────────────────────────────
   The sales map shows the same two lists as the dashboard - renewals and
   new leads - placed over the assets they name, or spread along the foot of
   the map when a lead names none yet. */

export interface LeadSite {
  id: string;
  title: string;
  account: string;
  value: string;
  stage: string;
  status: string;
  /** "Renewal" or "New lead" - the two sales alert lists. */
  category: string;
  owner: string;
  winConfidence: number;
  region: string;
  /** Asset codes the lead names. */
  assets: string[];
  /** Of those, the ones needing attention. */
  attention: string[];
  x: number;
  y: number;
}

export const LEAD_SITES: LeadSite[] = OPPORTUNITIES.map((o, i) => {
  const detail = OPPORTUNITY_DETAILS[o.id];
  const named = (detail?.assets ?? []).flatMap((a) => {
    const id = resolveAssetId(a.code);
    const site = id ? FLEET_SITES.find((s) => s.assetId === id) : undefined;
    return site ? [site] : [];
  });
  const x = named.length ? named.reduce((sum, s) => sum + s.x, 0) / named.length : 16 + i * 13;
  const y = named.length ? named.reduce((sum, s) => sum + s.y, 0) / named.length : 90;
  return {
    id: o.id,
    title: o.title,
    account: o.account,
    value: o.value,
    stage: o.stage,
    status: o.status,
    category: o.category,
    owner: o.owner,
    winConfidence: o.winConfidence,
    region: detail?.related.region ?? "North America",
    assets: named.map((s) => s.code),
    attention: named.filter(needsAttention).map((s) => s.code),
    x: Math.round(x),
    y: Math.round(y),
  };
});
