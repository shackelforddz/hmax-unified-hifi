import { SLA_CONTRACTS } from "@/lib/sales-data";

/* ── Operations persona data ─────────────────────────────────────── */

/* Portfolio Health Overview */
export const PORTFOLIO_HEALTH = {
  resourceCoverage: "87%",
  // Headline KPIs
  executedMargin: "18.6%",
  asSoldMargin: "19.4%",
  marginDelta: "0.8pp",
  revenue: "€18.4m",
  revenueForecast: "€18.9m",
  revenueDelta: "€0.5m",
  resourceNote: "3 roles to fill",
};

/* Contracts that need attention */
export type OpsStatus = "at-risk" | "critical";
export type RiskLevel = "low" | "med" | "high";
export interface RiskProfile {
  schedule: RiskLevel;
  cost: RiskLevel;
  quality: RiskLevel;
  safety: RiskLevel;
}
export type AlertCategory = "delivery" | "change-order" | "hse" | "quality";
export interface ContractAlert {
  category: AlertCategory;
  title: string;
  detail: string;
  action: string;
  /** The business consequence of this alert, shown in the card meta row. */
  impact?: string;
}
export interface OpsContract {
  id: string;
  name: string;
  customer: string;
  owner: string;
  value: string;
  status: OpsStatus;
  start: string; // contract term start (ISO)
  end: string;   // contract term end (ISO)
  progress: number; // % of contract term elapsed - derived from start/end
  risk: RiskProfile;
  alerts: ContractAlert[];
}

// Progress is measured purely by contract length: how far through the
// contract term we are today, clamped to 0–100%.
export function contractLengthProgress(start: string, end: string, now: Date = new Date()): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const t = now.getTime();
  if (t <= s) return 0;
  if (t >= e) return 100;
  return Math.round(((t - s) / (e - s)) * 100);
}

const RAW_CONTRACTS: Omit<OpsContract, "progress">[] = [
  {
    id: "ct-sherco",
    name: "Sherco HVDC winding replacement",
    customer: "Xcel Energy",
    owner: "Daniel Brooks",
    value: "€4.2m",
    status: "critical",
    start: "2026-06-01",
    end: "2026-12-15",
    risk: { schedule: "high", cost: "med", quality: "low", safety: "med" },
    alerts: [
      { category: "delivery", title: "18 days behind baseline - outage window at risk", detail: "Field mobilization slipped and the work is now tracking 18 days behind. Missing the 14 September outage window pushes delivery into February and defers a €1.2m milestone invoice.", action: "Adjust Schedule", impact: "€1.2m invoice deferred" },
      { category: "delivery", title: "Delta Coils is the critical path on winding sets", detail: "A single vendor gates the remaining scope; a further slip cascades across six projects.", action: "Reassign Vendor", impact: "6 projects exposed" },
      { category: "change-order", title: "Change order CO-204 · Additional winding sets - €320k", detail: "Scope adds two winding sets beyond the original contract. Review the technical impact and price before it's booked to release progress invoicing.", action: "Review change order", impact: "€320k unbooked" },
      { category: "quality", title: "NCR-071 · Weld porosity on winding set 2", detail: "QA radiography flagged porosity above the acceptance criteria on the second winding set. Disposition the non-conformance before assembly continues.", action: "Review NCR", impact: "Assembly on hold" },
      { category: "hse", title: "HSE complaint · Dropped-load near-miss during lift", detail: "A dropped-load near-miss was reported during the winding lift. HSE has opened a RIDDOR review - confirm the lifting-plan corrective actions.", action: "Review HSE report", impact: "RIDDOR review open" },
    ],
  },
  {
    id: "ct-northsea",
    name: "North Sea switchgear refurbishment",
    customer: "Siemens",
    owner: "Sarah Mitchell",
    value: "€2.4m",
    status: "critical",
    start: "2026-04-15",
    end: "2027-02-01",
    risk: { schedule: "high", cost: "high", quality: "med", safety: "low" },
    alerts: [
      { category: "delivery", title: "Crew over-allocated across the platform cluster", detail: "Field Service is at 96% utilisation with no slack for the additional protection-relay scope.", action: "Rebalance Crew", impact: "No slack for relay scope" },
      { category: "change-order", title: "Change order CO-118 · Protection-relay scope extension - €680k", detail: "Progress invoicing is blocked and reported margin sits 14pts under baseline until this change order is booked. Review and raise it for signature.", action: "Review change order", impact: "€680k invoice held" },
      { category: "change-order", title: "Change order CO-131 · Weather standby days - €120k", detail: "Additional weather standby days claimed by the vessel operator. Verify the logs and approve before booking.", action: "Review change order", impact: "€120k unverified" },
      { category: "hse", title: "HSE complaint · Working-at-height PPE non-use", detail: "A subcontractor was reported working at height without fall arrest. An HSE complaint is open - verify the toolbox-talk and re-induction records.", action: "Review HSE report", impact: "HSE complaint open" },
    ],
  },
  {
    id: "ct-baltic",
    name: "Baltic array transformer maintenance",
    customer: "Baltic Wind NL",
    owner: "Sarah Mitchell",
    value: "€2.4m",
    status: "at-risk",
    start: "2025-11-01",
    end: "2026-10-15",
    risk: { schedule: "low", cost: "low", quality: "med", safety: "high" },
    alerts: [
      { category: "delivery", title: "Two HSE certificates expire before the next visit", detail: "Offshore crew certifications lapse ahead of the planned window; remobilisation is blocked until they renew.", action: "Schedule Cert Renewal", impact: "Remobilisation blocked" },
      { category: "hse", title: "HSE complaint · Slip hazard on access gangway", detail: "Crew logged a slip hazard on the wet access gangway. Confirm the anti-slip remediation is closed out before the next mobilisation.", action: "Review HSE report", impact: "Mobilisation gated" },
      { category: "quality", title: "NCR-058 · Bushing torque values out of spec", detail: "A torque check on the transformer bushings fell outside specification. Disposition the non-conformance and re-torque to procedure.", action: "Review NCR", impact: "Re-torque required" },
    ],
  },
  {
    id: "ct-pacific",
    name: "Protection relay upgrade",
    customer: "Pacific Gas",
    owner: "Lena Fischer",
    value: "€440k",
    status: "at-risk",
    start: "2026-07-01",
    end: "2027-03-01",
    risk: { schedule: "med", cost: "low", quality: "low", safety: "med" },
    alerts: [
      { category: "delivery", title: "Site access unresolved - verbal only", detail: "Only a verbal arrangement is in place; a written access agreement is required before the crew can mobilise.", action: "Request Written Access", impact: "Crew cannot mobilise" },
      { category: "change-order", title: "Change order CO-241 · Written site-access agreement - €15k", detail: "Only a verbal access arrangement is in place. Review and issue the written change order before the crew can mobilise.", action: "Review change order", impact: "€15k unissued" },
    ],
  },
];

export const OPS_CONTRACTS: OpsContract[] = RAW_CONTRACTS.map((c) => ({
  ...c,
  progress: contractLengthProgress(c.start, c.end),
}));

/** "€4.2m", "€8.2M", "€440k" -> millions, so contract values can be summed. */
export const contractValueM = (v: string) => {
  const n = parseFloat(v.replace(/[^0-9.]/g, "")) || 0;
  return /k/i.test(v) ? n / 1000 : n;
};
export const formatM = (m: number) => `€${m.toFixed(1)}m`;

/* Contract counts and book value, counted from the delivery contracts and the
   service agreements themselves - so the KPI, the widgets and the list behind
   each KPI can never disagree. An agreement whose risk is verified is on
   track; one flagged Critical counts as critical, anything else at risk. */
const slaStatuses = Object.values(SLA_CONTRACTS).map((c) =>
  c.risk.verified ? "on-track" : c.risk.label === "Critical" ? "critical" : "at-risk"
);
const countBoth = (status: "critical" | "at-risk") =>
  OPS_CONTRACTS.filter((c) => c.status === status).length + slaStatuses.filter((s) => s === status).length;

export const CONTRACT_COUNTS = {
  active: OPS_CONTRACTS.length + slaStatuses.length,
  onTrack: slaStatuses.filter((s) => s === "on-track").length,
  atRisk: countBoth("at-risk"),
  critical: countBoth("critical"),
};

export const CONTRACT_BOOK = {
  /** Every active contract and agreement added up. */
  total: formatM(
    OPS_CONTRACTS.reduce((sum, c) => sum + contractValueM(c.value), 0) +
      Object.values(SLA_CONTRACTS).reduce((sum, c) => sum + contractValueM(c.value), 0)
  ),
  /** The share of it sitting on contracts that carry an open risk. */
  atRisk: formatM(
    OPS_CONTRACTS.reduce((sum, c) => sum + contractValueM(c.value), 0) +
      Object.values(SLA_CONTRACTS)
        .filter((c) => !c.risk.verified)
        .reduce((sum, c) => sum + contractValueM(c.value), 0)
  ),
};

export type PartStatus = "in-stock" | "ordered" | "backordered";
export type MaintStatus = "Scheduled" | "Overdue" | "Complete";
export type InvoiceStatus = "Paid" | "Sent" | "Overdue" | "Draft";
export interface OpsContractDetail {
  summary: string;
  recommendedActions: string[];
  milestones: { label: string; done: boolean; planned: string; actual?: string }[];
  risks: { title: string; detail: string; level: "Critical" | "High" | "Medium" }[];
  team: { role: string; name: string }[];
  /** Assets covered by this contract, with their condition score. */
  assets: { code: string; type: string; status: string; health: number }[];
  /** Parts & materials the contract work depends on. */
  parts: { label: string; qty: number; status: PartStatus }[];
  /** Scheduled maintenance on the covered assets. */
  maintenance: { task: string; due: string; interval: string; status: MaintStatus }[];
  /** Field-service visits under the contract. */
  fieldService: { visit: string; engineer: string; date: string; status: string }[];
  /** Where the three hand-offs stand: what the supplier owes, what the
   *  warehouse has done with it, and whether site can take the work. */
  readiness: { supplier: string[]; warehouse: string[]; site: string[] };
  /** Customer-side contacts. */
  contacts: { name: string; role: string; email: string; phone: string }[];
  /** Commercial position - revenue and net margin. */
  finance: { revenue: string; netMargin: string; asSoldMargin: string; invoiced: string; outstanding: string };
  /** Invoicing against milestones. */
  invoices: { code: string; milestone: string; amount: string; status: InvoiceStatus; due: string }[];
  /** Payment events timeline. */
  payments: { date: string; event: string; amount: string }[];
  related: { customer: string; value: string; region: string };
}

export const OPS_CONTRACT_DETAILS: Record<string, OpsContractDetail> = {
  "ct-sherco": {
    summary:
      "HVDC converter-transformer winding replacement at Sherco. Execution is 18 days behind baseline after a field-mobilization slip, putting the contractually-tied autumn outage window at risk and deferring a €1.2m milestone invoice.",
    recommendedActions: ["Adjust schedule", "Escalate delivery risk", "Reassign vendor"],
    milestones: [
      { label: "Engineering approval", done: true, planned: "2026-06-12", actual: "2026-06-16" },
      { label: "Material delivery (Delta Coils)", done: true, planned: "2026-04-20", actual: "2026-08-01" },
      { label: "Field mobilization", done: false, planned: "2026-08-10" },
      { label: "Site commissioning", done: false, planned: "2026-08-28" },
    ],
    risks: [
      { title: "Outage window slip", detail: "Missing 14 Sep pushes delivery into February.", level: "Critical" },
      { title: "Vendor concentration", detail: "Delta Coils gates the remaining scope across six projects.", level: "High" },
    ],
    team: [
      { role: "Project Manager", name: "Daniel Brooks" },
      { role: "Lead Engineer", name: "Jordan P." },
      { role: "Field Supervisor", name: "Liam O." },
    ],
    assets: [
      { code: "AST-001", type: "HVDC converter transformer · Unit S-12", status: "Critical" , health: 24 },
      { code: "AST-014", type: "HVDC converter transformer · Unit S-14", status: "At risk" , health: 47 },
      { code: "AST-019", type: "HVDC converter transformer · Unit S-19", status: "In service" , health: 82 },
    ],
    parts: [
      { label: "Converter winding set", qty: 2, status: "ordered" },
      { label: "HV bushing assembly", qty: 6, status: "in-stock" },
      { label: "Gasket & seal kit", qty: 3, status: "backordered" },
      { label: "Cooling fan assembly", qty: 4, status: "in-stock" },
    ],
    maintenance: [
      { task: "DGA oil sampling", due: "2026-08-15", interval: "Monthly", status: "Overdue" },
      { task: "Bushing thermography", due: "2026-09-20", interval: "Quarterly", status: "Scheduled" },
      { task: "Cooling system service", due: "2026-10-05", interval: "Annual", status: "Scheduled" },
    ],
    fieldService: [
      { visit: "Winding replacement - Unit S-12", engineer: "Daniel Brooks", date: "2026-09-02", status: "In progress" },
      { visit: "Site commissioning", engineer: "Liam O.", date: "2026-09-28", status: "Scheduled" },
    ],
    readiness: {
      supplier: ["PO delayed", "Component ready", "Lead-time risk", "6 affected projects"],
      warehouse: ["Material received", "GR pending", "Visual check pending", "Stock issue"],
      site: ["Access ready", "HSE clearance", "Equipment ready", "Technicians scheduled"],
    },
    contacts: [
      { name: "Karen Ellis", role: "Asset Manager · Xcel Energy", email: "k.ellis@xcelenergy.com", phone: "+1 612 555 0142" },
      { name: "Raj Patel", role: "Procurement Lead", email: "r.patel@xcelenergy.com", phone: "+1 612 555 0177" },
    ],
    finance: { revenue: "€4.2m", netMargin: "16.2%", asSoldMargin: "18.6%", invoiced: "€2.4m", outstanding: "€1.2m" },
    invoices: [
      { code: "INV-3301", milestone: "Engineering approval", amount: "€0.8m", status: "Paid", due: "2026-06-30" },
      { code: "INV-3302", milestone: "Material delivery", amount: "€1.6m", status: "Overdue", due: "2026-08-15" },
      { code: "INV-3310", milestone: "Field mobilization", amount: "€1.2m", status: "Draft", due: "2026-09-30" },
    ],
    payments: [
      { date: "2026-07-02", event: "INV-3301 paid", amount: "+€0.8m" },
      { date: "2026-08-15", event: "INV-3302 overdue", amount: "€1.6m" },
      { date: "2026-09-30", event: "INV-3310 milestone invoice - at risk", amount: "€1.2m" },
    ],
    related: { customer: "Xcel Energy", value: "€4.2m", region: "North America" },
  },
  "ct-northsea": {
    summary:
      "Switchgear refurbishment across the North Sea platform cluster. A signed change order is outstanding, holding a €680k progress invoice and dragging reported margin 14pts under baseline; the crew is also over-allocated for the added scope.",
    recommendedActions: ["Raise change order", "Rebalance crew", "Flag margin for review"],
    milestones: [
      { label: "Engineering approval", done: true, planned: "2026-05-02", actual: "2026-05-05" },
      { label: "Material delivery", done: true, planned: "2026-06-14", actual: "2026-06-20" },
      { label: "Field execution", done: false, planned: "2026-08-18" },
      { label: "Change order sign-off", done: false, planned: "2026-08-25" },
    ],
    risks: [
      { title: "Invoice blocked", detail: "€680k held until CO-118 is signed.", level: "High" },
      { title: "Crew over-allocation", detail: "Field Service at 96% with no slack.", level: "Medium" },
    ],
    team: [
      { role: "Project Manager", name: "Sarah Mitchell" },
      { role: "Lead Engineer", name: "Tom H." },
      { role: "Field Supervisor", name: "Sara B." },
    ],
    assets: [
      { code: "AST-021", type: "Protection relay bank · Platform A", status: "At risk" , health: 54 },
      { code: "AST-022", type: "MV switchgear panel · Platform B", status: "In service" , health: 88 },
    ],
    parts: [
      { label: "Protection relay module", qty: 8, status: "ordered" },
      { label: "Vacuum circuit breaker", qty: 3, status: "in-stock" },
      { label: "Busbar insulation set", qty: 2, status: "backordered" },
    ],
    maintenance: [
      { task: "Relay function test", due: "2026-09-12", interval: "Quarterly", status: "Scheduled" },
      { task: "Switchgear inspection", due: "2026-08-28", interval: "6-monthly", status: "Overdue" },
    ],
    fieldService: [
      { visit: "Protection-relay extension works", engineer: "Sara B.", date: "2026-09-08", status: "Blocked - CO unsigned" },
      { visit: "Platform B switchgear service", engineer: "Tom H.", date: "2026-09-18", status: "Scheduled" },
    ],
    readiness: {
      supplier: ["PO issued", "Component ready", "No lead-time risk", "2 affected projects"],
      warehouse: ["Material received", "GR complete", "Visual check passed", "No stock issue"],
      site: ["Access ready", "HSE clearance open", "Equipment ready", "Technicians over-allocated"],
    },
    contacts: [
      { name: "Ingrid Vos", role: "Programme Manager · Siemens", email: "i.vos@siemens.com", phone: "+44 20 7946 0321" },
      { name: "Mark Reid", role: "Commercial Contact", email: "m.reid@siemens.com", phone: "+44 20 7946 0388" },
    ],
    finance: { revenue: "€2.4m", netMargin: "4.6%", asSoldMargin: "18.6%", invoiced: "€1.1m", outstanding: "€0.68m" },
    invoices: [
      { code: "INV-2811", milestone: "Engineering approval", amount: "€0.5m", status: "Paid", due: "2026-05-30" },
      { code: "INV-2818", milestone: "Material delivery", amount: "€0.6m", status: "Overdue", due: "2026-07-30" },
      { code: "INV-2825", milestone: "CO-118 progress", amount: "€0.68m", status: "Draft", due: "2026-09-05" },
    ],
    payments: [
      { date: "2026-06-04", event: "INV-2811 paid", amount: "+€0.5m" },
      { date: "2026-08-02", event: "INV-2818 paid", amount: "+€0.6m" },
      { date: "2026-09-05", event: "INV-2825 blocked until CO-118 signed", amount: "€0.68m" },
    ],
    related: { customer: "Siemens", value: "€2.4m", region: "North Sea" },
  },
  "ct-baltic": {
    summary:
      "Offshore transformer maintenance across the Baltic Wind NL array. Delivery is close to baseline, but two HSE certificates expire before the next visit, which would block remobilisation of the offshore crew.",
    recommendedActions: ["Schedule cert renewal", "Confirm crew availability"],
    milestones: [
      { label: "Engineering approval", done: true, planned: "2026-05-20", actual: "2026-05-19" },
      { label: "Material delivery", done: true, planned: "2026-06-28", actual: "2026-06-28" },
      { label: "Field execution", done: true, planned: "2026-07-30", actual: "2026-07-31" },
      { label: "HSE certificate renewal", done: false, planned: "2026-08-30" },
    ],
    risks: [{ title: "Certificate lapse", detail: "Two crew certs expire before the next window.", level: "Medium" }],
    team: [
      { role: "Project Manager", name: "Sarah Mitchell" },
      { role: "HSE Officer", name: "Kara M." },
      { role: "Field Engineer", name: "Dev K." },
    ],
    assets: [
      { code: "AST-031", type: "Array transformer · WTG cluster 3", status: "At risk" , health: 51 },
      { code: "AST-032", type: "Array transformer · WTG cluster 4", status: "In service" , health: 79 },
    ],
    parts: [
      { label: "Transformer oil (barrels)", qty: 6, status: "in-stock" },
      { label: "Bushing gasket kit", qty: 4, status: "ordered" },
    ],
    maintenance: [
      { task: "Offshore transformer service", due: "2026-09-08", interval: "6-monthly", status: "Scheduled" },
      { task: "Oil quality check", due: "2026-07-30", interval: "Quarterly", status: "Complete" },
    ],
    fieldService: [
      { visit: "Array transformer maintenance", engineer: "Dev K.", date: "2026-09-08", status: "Blocked - cert lapse" },
    ],
    readiness: {
      supplier: ["PO issued", "Component ready", "No lead-time risk", "1 affected project"],
      warehouse: ["Material received", "GR complete", "Visual check passed", "No stock issue"],
      site: ["Access pending", "HSE certificates lapsing", "Equipment ready", "Technicians scheduled"],
    },
    contacts: [
      { name: "Femke Bakker", role: "O&M Manager · Baltic Wind NL", email: "f.bakker@balticwind.nl", phone: "+31 10 555 2210" },
    ],
    finance: { revenue: "€2.4m", netMargin: "17.1%", asSoldMargin: "18.2%", invoiced: "€1.9m", outstanding: "€0.5m" },
    invoices: [
      { code: "INV-4102", milestone: "Field execution", amount: "€1.9m", status: "Paid", due: "2026-08-10" },
      { code: "INV-4108", milestone: "HSE cert renewal visit", amount: "€0.5m", status: "Draft", due: "2026-09-15" },
    ],
    payments: [
      { date: "2026-08-12", event: "INV-4102 paid", amount: "+€1.9m" },
      { date: "2026-09-15", event: "INV-4108 pending cert renewal", amount: "€0.5m" },
    ],
    related: { customer: "Baltic Wind NL", value: "€2.4m", region: "North Sea" },
  },
  "ct-pacific": {
    summary:
      "Protection relay upgrade for Pacific Gas. On schedule but early, with site access unresolved - only a verbal change order is in place. A written agreement is needed before the crew can mobilise.",
    recommendedActions: ["Request written access", "Review access terms"],
    milestones: [
      { label: "Engineering approval", done: true, planned: "2026-06-01", actual: "2026-06-01" },
      { label: "Material delivery", done: true, planned: "2026-07-05", actual: "2026-07-04" },
      { label: "Site access agreement", done: false, planned: "2026-08-20" },
      { label: "Field execution", done: false, planned: "2026-09-01" },
    ],
    risks: [{ title: "Verbal-only access", detail: "Mobilisation delay risk without a written agreement.", level: "Medium" }],
    team: [
      { role: "Project Manager", name: "Lena Fischer" },
      { role: "Lead Engineer", name: "Priya K." },
    ],
    assets: [
      { code: "AST-041", type: "Protection relay bank · Substation West", status: "In service" , health: 91 },
    ],
    parts: [
      { label: "Relay hardware set", qty: 5, status: "in-stock" },
      { label: "Firmware licence", qty: 1, status: "ordered" },
    ],
    maintenance: [
      { task: "Relay firmware upgrade", due: "2026-09-21", interval: "One-off", status: "Scheduled" },
    ],
    fieldService: [
      { visit: "Relay upgrade - Substation West", engineer: "Priya K.", date: "2026-09-01", status: "Blocked - site access" },
    ],
    readiness: {
      supplier: ["PO issued", "Component ready", "Lead-time risk", "1 affected project"],
      warehouse: ["Material part-received", "GR pending", "Visual check pending", "No stock issue"],
      site: ["Access verbal only", "HSE clearance", "Equipment ready", "Technicians unscheduled"],
    },
    contacts: [
      { name: "Diego Ramos", role: "Substation Manager · Pacific Gas", email: "d.ramos@pge.com", phone: "+1 415 555 0190" },
    ],
    finance: { revenue: "€440k", netMargin: "19.8%", asSoldMargin: "20.1%", invoiced: "€180k", outstanding: "€0" },
    invoices: [
      { code: "INV-1904", milestone: "Material delivery", amount: "€180k", status: "Paid", due: "2026-07-10" },
      { code: "INV-1909", milestone: "Field execution", amount: "€260k", status: "Draft", due: "2026-09-30" },
    ],
    payments: [
      { date: "2026-07-11", event: "INV-1904 paid", amount: "+€180k" },
      { date: "2026-09-30", event: "INV-1909 pending site access", amount: "€260k" },
    ],
    related: { customer: "Pacific Gas", value: "€440k", region: "North Sea" },
  },
};

/* Financial Performance */
export interface MarginCause {
  label: string;
  impact: string;
}
export interface MarginPoint {
  label: string;
  value: number;
  /** What moved margin that month - revealed by clicking the point. */
  causes: MarginCause[];
}

export const FINANCIALS: {
  forecastMargin: string;
  revenue: string;
  cost: string;
  marginVsPlan: string;
  trend: MarginPoint[];
  planMargin: number;
} = {
  forecastMargin: "18.6%",
  revenue: "€18.4m",
  cost: "€15.0m",
  marginVsPlan: "-0.8pp",
  trend: [
    { label: "Mar", value: 19.4, causes: [] },
    {
      label: "Apr",
      value: 19.1,
      causes: [{ label: "Baltic array rework", impact: "−0.3pp" }],
    },
    {
      label: "May",
      value: 18.9,
      causes: [{ label: "Nexans cable price uplift", impact: "−0.2pp" }],
    },
    {
      label: "Jun",
      value: 18.8,
      causes: [{ label: "AEP Ohio mobilisation overrun", impact: "−0.1pp" }],
    },
    {
      label: "Jul",
      value: 18.6,
      causes: [
        { label: "Delta Coils vendor delay", impact: "−0.2pp" },
        { label: "Scope creep (unbilled)", impact: "−0.1pp" },
      ],
    },
    {
      label: "Aug",
      value: 18.6,
      causes: [
        { label: "Siemens change order unbooked", impact: "−0.5pp" },
        { label: "Delta Coils vendor delay", impact: "−0.2pp" },
        { label: "Scope creep (unbilled)", impact: "−0.1pp" },
      ],
    },
  ],
  planMargin: 19.4,
};

/* ── Response time ───────────────────────────────────────────────────
   Time from a customer raising a case to a first qualified response,
   against the 6-hour SLA commitment. */
export const RESPONSE_TIME = {
  current: "4.2h",
  delta: "0.8h vs last month",
  target: 6,
  min: 0,
  max: 9,
  points: [
    { label: "Mar", value: 7.4 },
    { label: "Apr", value: 6.8 },
    { label: "May", value: 6.1 },
    { label: "Jun", value: 5.4 },
    { label: "Jul", value: 5.0 },
    { label: "Aug", value: 4.2 },
  ],
};

/* ── Revenue & revenue timing ────────────────────────────────────────
   What has been invoiced against what has actually landed, plus how
   long the unpaid balance has been sitting. */
export const REVENUE_TIMING = {
  invoiced: "€16.1m",
  collected: "€13.8m",
  outstanding: "€2.3m",
  points: [
    { label: "Mar", invoiced: 2.4, collected: 2.3 },
    { label: "Apr", invoiced: 2.8, collected: 2.6 },
    { label: "May", invoiced: 2.6, collected: 2.5 },
    { label: "Jun", invoiced: 2.9, collected: 2.4 },
    { label: "Jul", invoiced: 2.7, collected: 2.1 },
    { label: "Aug", invoiced: 2.7, collected: 1.9 },
  ],
  aging: [
    { label: "0-30d", value: 0.9 },
    { label: "31-60d", value: 0.7 },
    { label: "61-90d", value: 0.4 },
    { label: "90d+", value: 0.3 },
  ],
};

/* ── Assets monitored ────────────────────────────────────────────────
   Installed base under active condition monitoring across the portfolio. */
export const ASSETS_MONITORED = {
  total: 248,
  delta: "12 vs last month",
  breakdown: [
    { label: "Healthy", value: 224 },
    { label: "At risk", value: 18 },
    { label: "Critical", value: 6 },
  ],
  points: [
    { label: "Mar", value: 208 },
    { label: "Apr", value: 214 },
    { label: "May", value: 221 },
    { label: "Jun", value: 229 },
    { label: "Jul", value: 236 },
    { label: "Aug", value: 248 },
  ],
};

/* Resource & Capacity */
export interface Team {
  name: string;
  utilization: number; // %
  headcount: number;
  allocated: number;
}
export const TEAMS: Team[] = [
  { name: "Engineering", utilization: 82, headcount: 24, allocated: 20 },
  { name: "Field Service", utilization: 96, headcount: 40, allocated: 38 },
  { name: "Reliability", utilization: 74, headcount: 12, allocated: 9 },
  { name: "PM", utilization: 88, headcount: 10, allocated: 9 },
];
export const CAPACITY_RISKS: { title: string; detail: string; severity: "High" | "Medium" }[] = [
  { title: "Field Service over-allocated in the North Sea", detail: "96% utilised with no slack for the Sherco outage window.", severity: "High" },
  { title: "PM capacity tight", detail: "One PM is covering three critical contracts this quarter.", severity: "High" },
  { title: "Reliability short 2 engineers for the Q4 program", detail: "Duke monitoring rollout needs two more reliability engineers.", severity: "Medium" },
];
