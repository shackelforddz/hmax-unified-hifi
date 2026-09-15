/* ── Contracts (PM / Operations) ───────────────────────────────── */

export type WoStatus = "open" | "scheduled" | "in-progress" | "blocked" | "complete";
export type WoPriority = "critical" | "high" | "medium" | "low";
export type WoType = "Corrective" | "Preventive" | "Inspection" | "Mobilisation";

export interface WorkOrder {
  id: string;
  code: string;         // WO-2041
  title: string;
  asset: string;        // AST-001
  customer: string;
  contract: string;
  type: WoType;
  priority: WoPriority;
  status: WoStatus;
  assignee: string;
  due: string;          // ISO date
  progress: number;     // %
}

export const WORK_ORDERS: WorkOrder[] = [
  { id: "wo-2041", code: "WO-2041", title: "Cooling-system diagnostic - hotspot", asset: "AST-001", customer: "ComEd", contract: "ComEd - 5-year Service Agreement", type: "Corrective", priority: "critical", status: "in-progress", assignee: "Daniel Brooks", due: "2026-09-02", progress: 45 },
  { id: "wo-2038", code: "WO-2038", title: "Bearing replacement - recurring fault", asset: "AST-002", customer: "ComEd", contract: "ComEd - 5-year Service Agreement", type: "Corrective", priority: "high", status: "scheduled", assignee: "Sarah Mitchell", due: "2026-09-10", progress: 0 },
  { id: "wo-2035", code: "WO-2035", title: "DGA oil sampling", asset: "AST-003", customer: "NV Energy", contract: "NV Energy - Service Agreement", type: "Preventive", priority: "medium", status: "open", assignee: "Lena Fischer", due: "2026-09-14", progress: 0 },
  { id: "wo-2031", code: "WO-2031", title: "Tap-changer vibration inspection", asset: "AST-004", customer: "AEP Ohio", contract: "AEP Ohio - Service Agreement", type: "Inspection", priority: "medium", status: "in-progress", assignee: "Marcus Lee", due: "2026-09-05", progress: 60 },
  { id: "wo-2027", code: "WO-2027", title: "HSE certificate renewal - offshore crew", asset: "AST-014", customer: "Baltic Wind NL", contract: "Baltic array transformer maintenance", type: "Mobilisation", priority: "high", status: "blocked", assignee: "Sarah Mitchell", due: "2026-08-30", progress: 20 },
  { id: "wo-2024", code: "WO-2024", title: "Protection relay firmware upgrade", asset: "AST-021", customer: "Pacific Gas", contract: "Protection relay upgrade", type: "Preventive", priority: "low", status: "scheduled", assignee: "Lena Fischer", due: "2026-09-21", progress: 0 },
  { id: "wo-2019", code: "WO-2019", title: "Bushing replacement - Unit S-12", asset: "AST-001", customer: "Xcel Energy", contract: "Sherco HVDC winding replacement", type: "Corrective", priority: "critical", status: "in-progress", assignee: "Daniel Brooks", due: "2026-09-01", progress: 30 },
  { id: "wo-2012", code: "WO-2012", title: "Annual thermal scan", asset: "AST-033", customer: "Duke Energy", contract: "Duke Energy - Service Agreement", type: "Inspection", priority: "low", status: "complete", assignee: "Marcus Lee", due: "2026-08-18", progress: 100 },
];

export interface WorkOrderDetail {
  summary: string;
  recommendedActions: string[];
  checklist: { label: string; done: boolean }[];
  parts: { label: string; qty: number; status: "in-stock" | "ordered" | "backordered" }[];
  timeline: { label: string; date: string }[];
  related: { asset: string; customer: string; contract: string };
}

export const WORK_ORDER_DETAILS: Record<string, WorkOrderDetail> = {
  "wo-2041": {
    summary:
      "Corrective contract raised from AST-001's thermal alert. Top-oil temperature is 14°C over rated and DGA hydrogen is elevated - the cooling circuit needs a full diagnostic before the autumn load peak. Crew is on site with the diagnostic partway complete.",
    recommendedActions: ["Escalate to reliability", "Order cooling parts", "Update ETA"],
    checklist: [
      { label: "Isolate and de-energise unit", done: true },
      { label: "Thermal scan / hotspot confirm", done: true },
      { label: "Cooling-fan bank inspection", done: false },
      { label: "Oil circulation pump test", done: false },
      { label: "Re-energise and monitor", done: false },
    ],
    parts: [
      { label: "Cooling fan assembly", qty: 2, status: "ordered" },
      { label: "Oil pump seal kit", qty: 1, status: "in-stock" },
    ],
    timeline: [
      { label: "Crew mobilised to site", date: "2026-08-26" },
      { label: "Contract raised from alert", date: "2026-08-24" },
    ],
    related: { asset: "AST-001", customer: "ComEd", contract: "ComEd - 5-year Service Agreement" },
  },
  "wo-2038": {
    summary:
      "Scheduled bearing replacement on AST-002 following a third failure in six months. The shortening failure interval points to end-of-life; this intervention buys runtime while a replacement quote is prepared.",
    recommendedActions: ["Request replacement quote", "Confirm crew slot", "Order parts"],
    checklist: [
      { label: "Confirm parts availability", done: true },
      { label: "Book crew & outage window", done: false },
      { label: "Replace bearing assembly", done: false },
      { label: "Vibration re-test", done: false },
    ],
    parts: [
      { label: "Bearing assembly", qty: 1, status: "in-stock" },
      { label: "Shaft seal", qty: 2, status: "in-stock" },
    ],
    timeline: [
      { label: "Contract scheduled", date: "2026-08-22" },
      { label: "Vibration alarm logged", date: "2026-08-14" },
    ],
    related: { asset: "AST-002", customer: "ComEd", contract: "ComEd - 5-year Service Agreement" },
  },
  "wo-2027": {
    summary:
      "Offshore remobilisation for the Baltic array is blocked: two HSE certificates lapse before the next visit. Renewals must clear before the crew can sail - the window is at risk until they do.",
    recommendedActions: ["Schedule cert renewal", "Escalate to HSE", "Rebook vessel"],
    checklist: [
      { label: "Identify lapsing certificates", done: true },
      { label: "Book renewal training", done: false },
      { label: "Confirm vessel slot", done: false },
      { label: "Re-mobilise crew", done: false },
    ],
    parts: [],
    timeline: [
      { label: "Mobilisation blocked", date: "2026-08-25" },
      { label: "Certificate expiry flagged", date: "2026-08-20" },
    ],
    related: { asset: "AST-014", customer: "Baltic Wind NL", contract: "Baltic array transformer maintenance" },
  },
};
