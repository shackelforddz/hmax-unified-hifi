"use client";

import { useState } from "react";
import DataTable, { type Column } from "@/components/dashboard/data-table";
import { useDetailDrawers } from "@/components/dashboard/detail-drawers";
import { ASSET_ALERTS, ASSET_DETAILS, type AssetAlert } from "@/lib/sales-data";

function StatusBadge({ status }: { status: AssetAlert["status"] }) {
  if (status === "critical") return <span className="bg-status-critical text-white font-bold text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">Critical</span>;
  return <span className="border border-gray-400 text-gray-700 text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">At risk</span>;
}

function HealthCell({ health }: { health: number }) {
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-chart-line rounded-full" style={{ width: `${health}%` }} />
      </div>
      <span className="text-xs text-gray-400 shrink-0">{health}%</span>
    </div>
  );
}

const contractOf = (a: AssetAlert) => ASSET_DETAILS[a.id]?.related.contract ?? "-";

const COLUMNS: Column<AssetAlert>[] = [
  { header: "Asset", cell: (a) => <span className="text-gray-900">{a.code}</span> },
  { header: "Type", cell: (a) => <span className="text-gray-700">{ASSET_DETAILS[a.id]?.type ?? "Power transformer"}</span> },
  { header: "Contract", cell: (a) => <span className="text-gray-500">{contractOf(a)}</span> },
  { header: "Location", cell: (a) => <span className="text-gray-500">{a.location}</span> },
  { header: "Health", cell: (a) => <HealthCell health={a.health} />, className: "w-40" },
  { header: "Status", cell: (a) => <StatusBadge status={a.status} />, align: "right" },
];

export default function AssetsTable() {
  const drawers = useDetailDrawers();
  const [contract, setContract] = useState("all");

  const contracts = Array.from(new Set(ASSET_ALERTS.map(contractOf))).sort();
  const rows = contract === "all" ? ASSET_ALERTS : ASSET_ALERTS.filter((a) => contractOf(a) === contract);

  const toolbar = (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400">Contract</span>
      <select
        value={contract}
        onChange={(e) => setContract(e.target.value)}
        className="text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-500 bg-white cursor-pointer outline-none hover:border-gray-300 max-w-[240px]"
      >
        <option value="all">All</option>
        {contracts.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      <DataTable
        title="Assets"
        subtitle={`${rows.length} monitored assets`}
        columns={COLUMNS}
        rows={rows}
        getKey={(a) => a.id}
        onRowClick={(a) => drawers?.openPage({ kind: "asset", id: a.id })}
        toolbar={toolbar}
      />
    </>
  );
}
