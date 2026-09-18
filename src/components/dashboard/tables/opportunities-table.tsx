"use client";

import DataTable, { type Column } from "@/components/dashboard/data-table";
import { useDetailDrawers } from "@/components/dashboard/detail-drawers";
import { OPPORTUNITIES, type Opportunity } from "@/lib/sales-data";


function StatusBadge({ status }: { status: Opportunity["status"] }) {
  const cls =
    status === "stalled" ? "bg-black text-white"
    : status === "at-risk" ? "border border-gray-400 text-gray-700"
    : "border border-gray-300 text-gray-500";
  const label = status === "on-track" ? "On track" : status === "at-risk" ? "At risk" : "Stalled";
  return <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>{label}</span>;
}

const COLUMNS: Column<Opportunity>[] = [
  { header: "Account", cell: (o) => <span className="text-gray-900">{o.account}</span> },
  { header: "Lead", cell: (o) => <span className="text-gray-700">{o.title}</span> },
  { header: "Value", cell: (o) => <span className="text-gray-700">{o.value}</span> },
  { header: "Stage", cell: (o) => <span className="text-gray-500">{o.stage}</span> },
  { header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
  { header: "Owner", cell: (o) => <span className="text-gray-500 whitespace-nowrap">{o.owner}</span>, align: "right" },
];

export default function OpportunitiesTable() {
  const drawers = useDetailDrawers();
  return (
    <>
      <DataTable
        title="Leads"
        subtitle={`${OPPORTUNITIES.length} leads`}
        columns={COLUMNS}
        rows={OPPORTUNITIES}
        getKey={(o) => o.id}
        onRowClick={(o) => drawers?.openPage({ kind: "lead", id: o.id })}
      />
    </>
  );
}
