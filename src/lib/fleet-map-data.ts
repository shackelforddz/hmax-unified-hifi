import { OPPORTUNITIES, OPPORTUNITY_DETAILS } from "@/lib/sales-data";
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

/** Under a delivery contract that is in execution now. */
export const hasActiveContract = (s: FleetSite) => !!s.contract;
export const hasLeads = (s: FleetSite) => s.leads.length > 0;

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
