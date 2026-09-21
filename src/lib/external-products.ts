/* ── The systems HMAX sits across ─────────────────────────────────────
   HMAX reads from these, so every so often the answer is "go and look at
   the record itself". Each entry lists what that system is the source of,
   so the rail can say where to go rather than just naming the product. */

export interface ExternalProduct {
  name: string;
  /** What this system is the system of record for. */
  sourceOf: string[];
}

export const EXTERNAL_PRODUCTS: ExternalProduct[] = [
  {
    name: "SAP",
    sourceOf: [
      "contracts",
      "cost actuals",
      "milestone status",
      "invoice status",
      "purchase orders",
      "work orders",
      "warehouse stock",
    ],
  },
  {
    name: "Salesforce",
    sourceOf: ["opportunity pipeline", "offer status", "account data", "as-sold scope", "contractual terms"],
  },
  {
    name: "Fiori",
    sourceOf: ["COTD status", "OPS/SO codes", "delivery tracking", "scenario planning"],
  },
  {
    name: "RelCare",
    sourceOf: ["asset condition data", "alarm history", "condition assessments", "DGA and PD readings"],
  },
  {
    name: "OneIB",
    sourceOf: [
      "install base records",
      "asset specifications",
      "commissioning data",
      "nameplate data",
      "asset register",
    ],
  },
  {
    name: "APM",
    sourceOf: ["asset health scores", "failure risk models", "criticality ranking", "maintenance strategy"],
  },
  {
    name: "Data Hub",
    sourceOf: ["cross-system reporting", "historical trends", "reconciled records", "data exports"],
  },
];
