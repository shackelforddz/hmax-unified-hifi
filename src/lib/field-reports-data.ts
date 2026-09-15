import type { AssetAlert, AssetCategory } from "@/lib/sales-data";

/* ── Field reports (Diagnostics) ─────────────────────────────────── */

// Asset alerts framed as the reports a diagnostics engineer needs to review -
// DGA trends, electrical test results, and physical inspection packages.
export const ASSET_REPORT_ALERTS: AssetAlert[] = [
  {
    id: "ast-001", code: "AST-001", location: "Zone A • Pump Station 1", health: 24, status: "critical", category: "dga",
    alert: {
      title: "DGA trend indicates a developing thermal fault",
      detail:
        "Historical and current dissolved-gas analysis on AST-001 shows rising ethylene and methane - a signature consistent with localized overheating. Review the DGA trend against the latest thermal scan before clearing.",
      action: "Review DGA trend",
      impact: "Localized overheating suspected",
    },
  },
  {
    id: "ast-002", code: "AST-002", location: "Zone A • Pump Station 1", health: 31, status: "critical", category: "electrical",
    alert: {
      title: "Electrical test results flag winding insulation",
      detail:
        "Latest power-factor and insulation-resistance results on AST-002 fall outside the commissioning baseline, pointing to insulation degradation. Interpret the electrical test set to confirm before the next switching operation.",
      action: "Review electrical tests",
      impact: "Insulation degradation",
    },
  },
  {
    id: "ast-004", code: "AST-004", location: "Zone A • Substation 2", health: 58, status: "at-risk", category: "dga",
    alert: {
      title: "DGA electrical-fault signature on tap-changer",
      detail:
        "Acetylene present in the latest DGA sample suggests arcing in the tap-changer compartment. Compare current and historical DGA to distinguish a genuine electrical fault from a sampling artefact.",
      action: "Review DGA trend",
      impact: "Possible tap-changer arcing",
    },
  },
  {
    id: "ast-003", code: "AST-003", location: "Zone B • Pump Station 3", health: 52, status: "at-risk", category: "physical",
    alert: {
      title: "Physical inspection: oil quality & thermography",
      detail:
        "The field package for AST-003 includes oil-quality tests, mechanical-condition notes, and thermography imaging. Review the physical inspection to determine whether cooling degradation is progressing.",
      action: "Review inspection report",
      impact: "Awaiting interpretation",
    },
  },
];

export const REPORT_CATEGORY_OPTIONS: { label: string; value: AssetCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "DGA", value: "dga" },
  { label: "Electrical", value: "electrical" },
  { label: "Physical inspection", value: "physical" },
];


export type ReportType = "Thermal scan" | "DGA sample" | "Vibration" | "Visual inspection" | "PD survey";
export type ReportPriority = "critical" | "high" | "medium" | "low";

export interface FieldReport {
  id: string;
  code: string;        // FR-4021
  asset: string;       // AST-001
  assetId: string;     // ast-001 (opens the asset drawer)
  type: ReportType;
  engineer: string;
  submitted: string;   // ISO date
  waitingDays: number; // days awaiting interpretation
  faultSignature: boolean;
  priority: ReportPriority;
  finding: string;
  /** Captioned photos the engineer attached, shown with the report. */
  photos: string[];
}

// Reports submitted from the field, waiting on interpretation.
export const REPORTS_AWAITING: FieldReport[] = [
  { id: "fr-4021", code: "FR-4021", asset: "AST-001", assetId: "ast-001", type: "Thermal scan", engineer: "Daniel Brooks", submitted: "2026-08-24", waitingDays: 4, faultSignature: true, priority: "critical", finding: "Hotspot on Y-phase bushing, 14°C over rated.", photos: ["Y-phase bushing · thermal overlay", "Bushing bank · wide view", "Nameplate reference"] },
  { id: "fr-4018", code: "FR-4018", asset: "AST-002", assetId: "ast-002", type: "Vibration", engineer: "Sarah Mitchell", submitted: "2026-08-22", waitingDays: 6, faultSignature: true, priority: "high", finding: "Bearing signature at 7.1 mm/s, matches prior failure.", photos: ["Drive-end bearing housing", "Accelerometer placement", "Coupling alignment"] },
  { id: "fr-4015", code: "FR-4015", asset: "AST-003", assetId: "ast-003", type: "DGA sample", engineer: "Lena Fischer", submitted: "2026-08-25", waitingDays: 3, faultSignature: false, priority: "medium", finding: "Gas ratios within limits; trend monitoring only.", photos: ["Oil sampling valve", "Sample vial · labelled"] },
  { id: "fr-4012", code: "FR-4012", asset: "AST-004", assetId: "ast-004", type: "PD survey", engineer: "Marcus Lee", submitted: "2026-08-20", waitingDays: 8, faultSignature: true, priority: "high", finding: "Partial-discharge activity on tap-changer compartment.", photos: ["Tap-changer compartment", "PD sensor placement", "Access hatch seal"] },
  { id: "fr-4009", code: "FR-4009", asset: "AST-001", assetId: "ast-001", type: "DGA sample", engineer: "Priya Nair", submitted: "2026-08-26", waitingDays: 2, faultSignature: false, priority: "medium", finding: "Hydrogen elevated but stable; corroborates thermal scan.", photos: ["Sampling point · lower drain", "Sample vial · labelled"] },
  { id: "fr-4005", code: "FR-4005", asset: "AST-003", assetId: "ast-003", type: "Visual inspection", engineer: "Lena Fischer", submitted: "2026-08-19", waitingDays: 9, faultSignature: true, priority: "medium", finding: "Surface corrosion on cooling manifold; gasket seepage.", photos: ["Cooling manifold · corrosion", "Gasket seepage · close-up", "Manifold · wide view", "Drip tray"] },
  { id: "fr-4001", code: "FR-4001", asset: "AST-002", assetId: "ast-002", type: "Thermal scan", engineer: "Marcus Lee", submitted: "2026-08-18", waitingDays: 10, faultSignature: false, priority: "low", finding: "No thermal anomaly; baseline for trend.", photos: ["Thermal overlay · baseline", "Radiator bank · wide view"] },
];

// How long a field report actually takes - end-to-end lifecycle.
export const REPORT_TURNAROUND = {
  actualDays: 14,
  targetDays: 10,
  stages: [
    { label: "Request → Dispatch", days: 2 },
    { label: "Dispatch → On-site", days: 3 },
    { label: "On-site → Submitted", days: 4 },
    { label: "Submitted → Interpreted", days: 5 },
  ],
  // Avg turnaround trend, most recent last.
  trend: [16, 15, 15, 13, 14, 13, 14],
};

export const DIAGNOSTICS_STATS = {
  // Reports not yet interpreted across all queues (awaiting + in review).
  outstandingReports: 12,
};
