"use client";

import DataTable, { type Column } from "@/components/dashboard/data-table";
import { useDetailDrawers } from "@/components/dashboard/detail-drawers";
import { OPS_CONTRACTS, type OpsContract } from "@/lib/operations-data";
import HealthBar from "@/components/dashboard/health-bar";

function ContractStatusBadge({ status }: { status: OpsContract["status"] }) {
  if (status === "critical") return <span className="bg-status-critical-deep text-white font-bold text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">Critical</span>;
  return <span className="border border-gray-400 text-gray-700 text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">At risk</span>;
}

const COLUMNS: Column<OpsContract>[] = [
  { header: "Contract", cell: (c) => <span className="text-gray-900">{c.name}</span> },
  { header: "Customer", cell: (c) => <span className="text-gray-700">{c.customer}</span> },
  { header: "Value", cell: (c) => <span className="text-gray-700">{c.value}</span> },
  {
    header: "Delivery progress",
    cell: (c) => (
      <HealthBar pct={c.progress} className="flex items-center gap-2 min-w-[120px]" trackClassName="flex-1 h-2 bg-gray-100" />
    ),
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
