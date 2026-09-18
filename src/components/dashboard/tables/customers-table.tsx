"use client";

import { ChevronRight } from "lucide-react";
import DataTable, { type Column } from "@/components/dashboard/data-table";
import { useDetailDrawers } from "@/components/dashboard/detail-drawers";
import { OPS_CONTRACTS, OPS_CONTRACT_DETAILS, type OpsContract } from "@/lib/operations-data";

/* ── Estate roll-up ──────────────────────────────────────────────────
   A customer's estate is everything their contracts cover: the book
   value, the assets under those contracts, and the alerts against them. */
interface Estate {
  customer: string;
  contracts: OpsContract[];
  value: number;
  assets: number;
  avgHealth: number;
  alerts: number;
  status: OpsContract["status"];
}

/** "€4.2m" / "€440k" -> millions. */
function parseValue(v: string): number {
  const n = parseFloat(v.replace(/[^0-9.]/g, ""));
  return /k\b/i.test(v) ? n / 1000 : n;
}

function fmtValue(m: number): string {
  return m >= 1 ? `€${m.toFixed(1)}m` : `€${Math.round(m * 1000)}k`;
}

function coveredAssets(contract: OpsContract) {
  return OPS_CONTRACT_DETAILS[contract.id]?.assets ?? [];
}

const ESTATES: Estate[] = [...new Set(OPS_CONTRACTS.map((c) => c.customer))]
  .map((customer) => {
    const contracts = OPS_CONTRACTS.filter((c) => c.customer === customer);
    const assets = contracts.flatMap(coveredAssets);
    return {
      customer,
      contracts,
      value: contracts.reduce((s, c) => s + parseValue(c.value), 0),
      assets: assets.length,
      avgHealth: assets.length ? Math.round(assets.reduce((s, a) => s + a.health, 0) / assets.length) : 0,
      alerts: contracts.reduce((s, c) => s + c.alerts.length, 0),
      status: (contracts.some((c) => c.status === "critical") ? "critical" : "at-risk") as OpsContract["status"],
    };
  })
  .sort((a, b) => b.value - a.value);

/* ── Shared cells ────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const critical = status === "critical" || status === "Critical";
  const atRisk = status === "at-risk" || status === "At risk";
  const cls = critical ? "bg-status-critical text-white font-bold" : atRisk ? "border border-gray-400 text-gray-700" : "border border-gray-200 text-gray-400";
  const label = critical ? "Critical" : atRisk ? "At risk" : status === "In service" ? "In service" : "On track";
  return <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>{label}</span>;
}

function HealthBar({ pct }: { pct: number }) {
  const low = pct < 40;
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="relative flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${low ? "bg-status-critical" : "bg-chart-line"}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs shrink-0 ${low ? "text-gray-900" : "text-gray-400"}`}>{pct}%</span>
    </div>
  );
}

function Drillable({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-gray-900">
      {children}
      <ChevronRight size={13} strokeWidth={1.5} className="text-gray-300" />
    </span>
  );
}

/* ── Columns per level ───────────────────────────────────────────── */
const ESTATE_COLUMNS: Column<Estate>[] = [
  { header: "Customer", cell: (e) => <Drillable>{e.customer}</Drillable> },
  { header: "Contracts", cell: (e) => <span className="text-gray-700">{e.contracts.length}</span> },
  { header: "Estate value", cell: (e) => <span className="text-gray-700">{fmtValue(e.value)}</span> },
  { header: "Assets", cell: (e) => <span className="text-gray-700">{e.assets}</span> },
  { header: "Avg health", cell: (e) => <HealthBar pct={e.avgHealth} />, className: "w-44" },
  { header: "Open alerts", cell: (e) => <span className="text-gray-700">{e.alerts}</span> },
  { header: "Status", cell: (e) => <StatusBadge status={e.status} />, align: "right" },
];

export default function CustomersTable() {
  const drawers = useDetailDrawers();

  return (
    <>
      <DataTable
        title="Customers"
        subtitle={`${ESTATES.length} customers · ${fmtValue(ESTATES.reduce((s, e) => s + e.value, 0))} under contract`}
        columns={ESTATE_COLUMNS}
        rows={ESTATES}
        getKey={(e) => e.customer}
        onRowClick={(e) => drawers?.openPage({ kind: "customer", id: e.customer })}
      />
    </>
  );
}
