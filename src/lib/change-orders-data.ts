/* Change orders referenced by the ops contract alerts, so the
   "Review change order" CTA can recap and link the actual CO. */

export interface ChangeOrder {
  code: string;
  contract: string;
  contractId: string;
  scope: string;
  reason: string;
  value: string;
  scheduleImpact: string;
  marginImpact: string;
  status: "Draft" | "Awaiting signature" | "In review";
  raised: string;
  requestedBy: string;
}

export const CHANGE_ORDERS: Record<string, ChangeOrder> = {
  "CO-204": {
    code: "CO-204",
    contract: "Sherco HVDC winding replacement",
    contractId: "ct-sherco",
    scope: "Two additional winding sets beyond the original contract",
    reason: "Scope addition",
    value: "€320k",
    scheduleImpact: "+3 weeks",
    marginImpact: "-2.4pts until booked",
    status: "Awaiting signature",
    raised: "2026-08-20",
    requestedBy: "Daniel Brooks",
  },
  "CO-118": {
    code: "CO-118",
    contract: "North Sea switchgear refurbishment",
    contractId: "ct-northsea",
    scope: "Protection-relay scope extension across the platform cluster",
    reason: "Scope addition",
    value: "€680k",
    scheduleImpact: "+5 weeks",
    marginImpact: "-14pts vs baseline until booked",
    status: "Awaiting signature",
    raised: "2026-08-12",
    requestedBy: "Sarah Mitchell",
  },
  "CO-131": {
    code: "CO-131",
    contract: "North Sea switchgear refurbishment",
    contractId: "ct-northsea",
    scope: "Additional weather standby days claimed by the vessel operator",
    reason: "Weather standby",
    value: "€120k",
    scheduleImpact: "None",
    marginImpact: "-1.1pts",
    status: "In review",
    raised: "2026-08-24",
    requestedBy: "Sarah Mitchell",
  },
  "CO-241": {
    code: "CO-241",
    contract: "Protection relay upgrade",
    contractId: "ct-pacific",
    scope: "Written site-access agreement to replace the verbal arrangement",
    reason: "Site access",
    value: "€15k",
    scheduleImpact: "Unblocks mobilisation",
    marginImpact: "Neutral",
    status: "Draft",
    raised: "2026-08-28",
    requestedBy: "Lena Fischer",
  },
};
