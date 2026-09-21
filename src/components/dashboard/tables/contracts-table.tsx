"use client";

import DataTable, { type Column } from "@/components/dashboard/data-table";
import { useDetailDrawers } from "@/components/dashboard/detail-drawers";
import { OPS_CONTRACTS, type OpsContract } from "@/lib/operations-data";

function ContractStatusBadge({ status }: { status: OpsContract["status"] }) {
  if (status === "critical") return <span className="bg-status-critical-deep text-white font-bold text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">Critical</span>;
  return <span className="border border-gray-400 text-gray-700 text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">At risk</span>;
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="relative flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-chart-line rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 shrink-0">{pct}%</span>
    </div>
  );
}

const COLUMNS: Column<OpsContract>[] = [
  { header: "Contract", cell: (c) => <span className="text-gray-900">{c.name}</span> },
  { header: "Customer", cell: (c) => <span className="text-gray-700">{c.customer}</span> },
  { header: "Value", cell: (c) => <span className="text-gray-700">{c.value}</span> },
  {
    header: "Delivery progress",
    cell: (c) => <ProgressBar pct={c.progress} />,
    className: "w-44",
  },
  { header: "Status", cell: (c) => <ContractStatusBadge status={c.status} /> },
  {
    header: "Owner",
    cell: (c) => <span className="text-gray-500 whitespace-nowrap">{c.owner}</span>,
    align: "right",
  },
];

export default function ContractsTable() {
  const drawers = useDetailDrawers();

  return (
    <>
      <DataTable
        title="Contracts"
        subtitle={`${OPS_CONTRACTS.length} active contracts`}
        columns={COLUMNS}
        rows={OPS_CONTRACTS}
        getKey={(c) => c.id}
        onRowClick={(c) => drawers?.openPage({ kind: "ops", id: c.id })}
      />
    </>
  );
}
