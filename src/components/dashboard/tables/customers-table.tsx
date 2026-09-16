"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import DataTable, { type Column } from "@/components/dashboard/data-table";
import ContractDrawer from "@/components/dashboard/operations/contract-drawer";
import CustomerDrawer from "@/components/dashboard/operations/customer-drawer";
import AssetDrawer from "@/components/dashboard/sales/asset-drawer";
import { ASSET_DETAILS } from "@/lib/sales-data";
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
  const [customer, setCustomer] = useState<string | null>(null);
  const [contractDrawer, setContractDrawer] = useState<string | null>(null);
  const [assetDrawer, setAssetDrawer] = useState<string | null>(null);
  // Which customer a contract/asset drawer was drilled out of, so it can
  // offer a way back up.
  const [cameFrom, setCameFrom] = useState<string | null>(null);

  const back = cameFrom
    ? {
        label: `Back to ${cameFrom}`,
        onClick: () => {
          setContractDrawer(null);
          setAssetDrawer(null);
          setCustomer(cameFrom);
          setCameFrom(null);
        },
      }
    : undefined;

  return (
    <>
      {/* The three drawers swap between each other rather than stacking. */}
      <CustomerDrawer
        customer={customer}
        onClose={() => setCustomer(null)}
        onOpenContract={(id) => {
          setCameFrom(customer);
          setCustomer(null);
          setContractDrawer(id);
        }}
        onOpenAsset={(code, contractId) => {
          setCameFrom(customer);
          setCustomer(null);
          // Only assets with a detail record have an asset drawer; the rest
          // fall back to the contract that covers them.
          const id = code.toLowerCase();
          if (ASSET_DETAILS[id]) setAssetDrawer(id);
          else setContractDrawer(contractId);
        }}
      />
      <ContractDrawer
        contractId={contractDrawer}
        onClose={() => {
          setContractDrawer(null);
          setCameFrom(null);
        }}
        back={back}
      />
      <AssetDrawer
        assetId={assetDrawer}
        onClose={() => {
          setAssetDrawer(null);
          setCameFrom(null);
        }}
        back={back}
      />

      <DataTable
        title="Customers"
        subtitle={`${ESTATES.length} customers · ${fmtValue(ESTATES.reduce((s, e) => s + e.value, 0))} under contract`}
        columns={ESTATE_COLUMNS}
        rows={ESTATES}
        getKey={(e) => e.customer}
        onRowClick={(e) => setCustomer(e.customer)}
      />
    </>
  );
}
