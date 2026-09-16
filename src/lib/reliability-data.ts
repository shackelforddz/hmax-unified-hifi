import type { AssetAlert, AssetCategory } from "@/lib/sales-data";

/* ── Reliability engineering - review data ───────────────────────── */

// Asset alerts framed as engineering reviews the reliability engineer must
// clear - scope feasibility, design/drawings, site constraints, standards.
export const ASSET_REVIEW_ALERTS: AssetAlert[] = [
  {
    id: "ast-001", code: "AST-001", location: "Zone A • Pump Station 1", health: 24, status: "critical", category: "scope-feasibility",
    alert: {
      title: "Proposed service scope may exceed the thermal rating",
      detail:
        "The continuous-load uplift in the AST-001 service scope pushes the transformer past its 65 °C temp-rise limit. Check the nameplate and thermal limits before confirming the scope is technically feasible.",
      action: "Review feasibility",
      impact: "Cooling upgrade required",
    },
  },
  {
    id: "ast-002", code: "AST-002", location: "Zone A • Pump Station 1", health: 31, status: "critical", category: "design",
    alert: {
      title: "As-built differs from the design single-line diagram",
      detail:
        "The protection scheme on site doesn't match the SLD on file. Review the original design drawings and FAT report before scoping the retrofit procedure.",
      action: "Review drawings",
      impact: "Retrofit scope unreliable",
    },
  },
  {
    id: "ast-003", code: "AST-003", location: "Zone B • Pump Station 3", health: 52, status: "at-risk", category: "site",
    alert: {
      title: "Handover scope assumes crane access the site can't provide",
      detail:
        "The sales handover assumes 40-tonne crane access, but the Zone B site has a height barrier and a restricted access road. Reconcile the handover scope with the actual site constraints.",
      action: "Review site constraints",
      impact: "Handover not executable",
    },
  },
  {
    id: "ast-004", code: "AST-004", location: "Zone A • Substation 2", health: 58, status: "at-risk", category: "standards",
    alert: {
      title: "New safety notification applies to this tap-changer",
      detail:
        "Hitachi safety notification SN-2026-014 covers the AST-004 tap-changer series. Confirm the maintenance/diagnostic procedure reflects the updated standard before dispatch.",
      action: "Review standard",
      impact: "Procedure out of date",
    },
  },
];

export const REVIEW_CATEGORY_OPTIONS: { label: string; value: AssetCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Feasibility", value: "scope-feasibility" },
  { label: "Design", value: "design" },
  { label: "Site", value: "site" },
  { label: "Standards", value: "standards" },
];

/* ── Scope reviews from sales (contracts to review) ──────────────── */
export type ScopeVerdict = "pending" | "feasible" | "at-risk" | "not-feasible";

export interface ScopeReview {
  id: string;
  account: string;
  scope: string;
  value: string;
  from: string;        // sales owner
  submitted: string;
  contractId: string;  // opens the contract drawer for technical review
  verdict: ScopeVerdict;
  detail: string;
  action: string;      // recommended review action
  /** The business consequence of the verdict, shown in the card meta row. */
  impact?: string;
}

export const SCOPE_REVIEWS: ScopeReview[] = [
  {
    id: "sr-sherco", account: "Xcel Energy", scope: "Continuous-load uplift on Sherco HVDC", value: "€3.1m", from: "Priya N.", submitted: "2026-08-24", contractId: "ct-sherco", verdict: "at-risk",
    detail: "The continuous-load uplift pushes the transformer past its 65 °C temp-rise limit. Feasible only with a cooling upgrade - confirm the thermal headroom against the nameplate before the scope is committed.",
    action: "Review feasibility",
    impact: "Cooling upgrade required",
  },
  {
    id: "sr-northsea", account: "Siemens", scope: "Protection-relay scope extension - North Sea", value: "€680k", from: "Marcus Lee", submitted: "2026-08-22", contractId: "ct-northsea", verdict: "pending",
    detail: "As-built protection on the platform cluster differs from the design SLD. Verify the original drawings and FAT report before approving the retrofit scope and procedure.",
    action: "Review feasibility",
    impact: "Retrofit scope unreliable",
  },
  {
    id: "sr-baltic", account: "Baltic Wind NL", scope: "Transformer maintenance scope extension", value: "€1.2m", from: "Priya N.", submitted: "2026-08-20", contractId: "ct-baltic", verdict: "feasible",
    detail: "Additional array-transformer maintenance scope. Validated - asset condition, design drawings and site access all check out. Ready to hand to execution.",
    action: "Confirm scope",
    impact: "Ready for execution",
  },
  {
    id: "sr-pacific", account: "Pacific Gas", scope: "Relay upgrade expansion - Zone B", value: "€440k", from: "Lena Fischer", submitted: "2026-08-15", contractId: "ct-pacific", verdict: "not-feasible",
    detail: "The Zone B expansion assumes 40 t crane access the site can't provide (height barrier, restricted road). Not feasible as scoped - return to sales for a rescope.",
    action: "Return to sales",
    impact: "Not feasible as scoped",
  },
];

/* ── Handover scope vs actual site constraints ───────────────────── */
export type ConstraintStatus = "ok" | "conflict";

export interface SiteConstraint {
  id: string;
  asset: string;
  type: string;       // Crane access / Outage window / Physical barrier / Access road
  handover: string;   // what sales/handover assumed
  actual: string;     // site reality
  status: ConstraintStatus;
}

export const SITE_CONSTRAINTS: SiteConstraint[] = [
  { id: "sc-1", asset: "AST-003", type: "Crane access", handover: "40 t mobile crane on hardstand", actual: "Height barrier - 25 t max, restricted road", status: "conflict" },
  { id: "sc-2", asset: "AST-001", type: "Outage window", handover: "72-hour planned outage", actual: "Grid limits to 36 h in autumn peak", status: "conflict" },
  { id: "sc-3", asset: "AST-002", type: "Physical barrier", handover: "Open bay access", actual: "Adjacent live equipment - 3 m clearance", status: "conflict" },
  { id: "sc-4", asset: "AST-004", type: "Access road", handover: "Direct hardstand delivery", actual: "Confirmed - no constraint", status: "ok" },
];

/* ── Engineering standards, product updates & safety notifications ─ */
export type BulletinType = "Standard" | "Product update" | "Safety notification";

export interface Bulletin {
  id: string;
  type: BulletinType;
  ref: string;
  title: string;
  date: string;
  appliesTo: string;
}

export const ENG_BULLETINS: Bulletin[] = [
  { id: "b-1", type: "Safety notification", ref: "SN-2026-014", title: "Tap-changer arcing risk on 25 MVA series - revised inspection interval", date: "2026-08-20", appliesTo: "AST-004 series" },
  { id: "b-2", type: "Standard", ref: "STD-TR-2026.2", title: "Updated DGA interpretation thresholds (IEC 60599 alignment)", date: "2026-08-05", appliesTo: "All transformers" },
  { id: "b-3", type: "Product update", ref: "PU-COOL-118", title: "Cooling-fan controller firmware update available", date: "2026-07-28", appliesTo: "40 MVA fleet" },
  { id: "b-4", type: "Safety notification", ref: "SN-2026-009", title: "Bushing gasket recall - batch 2021-Q3", date: "2026-07-10", appliesTo: "AST-001, AST-002" },
];
