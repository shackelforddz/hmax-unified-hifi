import { ASSET_DETAILS, SLA_CONTRACTS, type AssetDetail } from "@/lib/sales-data";
import { OPS_CONTRACTS, OPS_CONTRACT_DETAILS } from "@/lib/operations-data";

// Some records name an asset by its site unit tag rather than its asset code.
const UNIT_ALIASES: Record<string, string> = {
  "S-12": "AST-001",
  "S-14": "AST-014",
  "S-19": "AST-019",
  "P-04": "AST-022",
  "T-07": "AST-031",
  "R-21": "AST-041",
};

/** Resolve an asset reference ("AST-014", "S-12", "S-12 - HVDC Converter
 *  Transformer") to its asset-drawer id, or null if it names no asset. */
export function resolveAssetId(ref: string): string | null {
  const token = ref.trim().split(/\s+/)[0].toUpperCase();
  const code = UNIT_ALIASES[token] ?? token;
  return /^AST-\d+$/.test(code) ? code.toLowerCase() : null;
}

const HEALTH_BY_STATUS: Record<string, number> = { Critical: 25, "At risk": 55, "In service": 85 };

const cache: Record<string, AssetDetail | null> = {};

/** The asset's full detail record, or - for assets without one - a sparse
 *  record assembled from the contracts that cover it. */
export function getAssetDetail(id: string): AssetDetail | null {
  if (ASSET_DETAILS[id]) return ASSET_DETAILS[id];
  if (id in cache) return cache[id];

  const code = id.toUpperCase();
  let found: { type: string; status: string; health?: number; customer: string; contract: string; region: string; maintenance: { task: string; due: string }[] } | null = null;

  for (const c of OPS_CONTRACTS) {
    const d = OPS_CONTRACT_DETAILS[c.id];
    const a = d?.assets.find((x) => x.code === code);
    if (d && a) {
      found = { ...a, customer: c.customer, contract: c.name, region: d.related.region, maintenance: d.maintenance };
      break;
    }
  }
  if (!found) {
    for (const s of Object.values(SLA_CONTRACTS)) {
      const a = s.assets.find((x) => x.code === code);
      if (a) {
        found = { ...a, customer: s.account, contract: s.agreement, region: s.region, maintenance: s.maintenance };
        break;
      }
    }
  }
  if (!found) return (cache[id] = null);

  const healthPct = found.health ?? HEALTH_BY_STATUS[found.status] ?? 60;
  const detail: AssetDetail = {
    code,
    type: found.type,
    location: `${found.customer} · ${found.region}`,
    stats: { healthPct, status: found.status, commissioned: "-", lastService: "-" },
    contextSummary: `${code} is a ${found.type.split(" · ")[0].toLowerCase()} covered by ${found.contract}. It is currently ${found.status.toLowerCase()} with a condition score of ${healthPct}%. No condition-monitoring feed is connected yet, so readings and risks are not available.`,
    recommendedActions: ["Schedule inspection", "Add to watch list"],
    readings: [],
    maintenance: found.maintenance.map((m) => ({ label: m.task, date: m.due })),
    risks: [],
    related: { customer: found.customer, contract: found.contract, station: found.region },
  };
  return (cache[id] = detail);
}
