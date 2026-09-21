"use client";

import { useState } from "react";
import DataTable, { type Column } from "@/components/dashboard/data-table";
import { useDetailDrawers } from "@/components/dashboard/detail-drawers";
import { useConversationLauncher } from "@/components/dashboard/conversation-launcher";
import { OPPORTUNITIES, type Opportunity, type OppCategory } from "@/lib/sales-data";

function StatusBadge({ status }: { status: Opportunity["status"] }) {
  const cls =
    status === "stalled" ? "bg-black text-white"
    : status === "at-risk" ? "border border-gray-400 text-gray-700"
    : "border border-gray-300 text-gray-500";
  const label = status === "on-track" ? "On track" : status === "at-risk" ? "At risk" : "Stalled";
  return <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>{label}</span>;
}

/* A renewal is a contract already in the book coming round again, so it reads
   differently from a lead that has no history behind it. */
function TypeBadge({ category }: { category: OppCategory }) {
  const renewal = category === "Renewal";
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${
        renewal ? "bg-gray-900 text-white" : "border border-gray-300 text-gray-500"
      }`}
    >
      {category}
    </span>
  );
}

const COLUMNS: Column<Opportunity>[] = [
  { header: "Account", cell: (o) => <span className="text-gray-900">{o.account}</span> },
  { header: "Lead", cell: (o) => <span className="text-gray-700">{o.title}</span> },
  { header: "Type", cell: (o) => <TypeBadge category={o.category} /> },
  { header: "Value", cell: (o) => <span className="text-gray-700">{o.value}</span> },
  { header: "Stage", cell: (o) => <span className="text-gray-500">{o.stage}</span> },
  { header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
  { header: "Owner", cell: (o) => <span className="text-gray-500 whitespace-nowrap">{o.owner}</span>, align: "right" },
];

const FILTERS = ["All", "Renewals", "New leads"] as const;

export default function OpportunitiesTable() {
  const drawers = useDetailDrawers();
  const launch = useConversationLauncher();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const rows = OPPORTUNITIES.filter(
    (o) => filter === "All" || (filter === "Renewals" ? o.category === "Renewal" : o.category === "New lead")
  );
  const renewals = OPPORTUNITIES.filter((o) => o.category === "Renewal").length;

  const toolbar = (
    <div className="flex items-center gap-2">
      {/* Same CTA the new-business list carries on the overview */}
      <button
        onClick={() => launch({ context: "New lead", prompt: "Build a new lead" })}
        className="h-8 px-3.5 rounded-full border border-dashed border-gray-300 text-sm font-bold text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
      >
        Build a new lead
      </button>
      <div role="tablist" aria-label="Lead type" className="bg-gray-100 h-8 flex items-center p-[3px] rounded-full shrink-0">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`h-full px-3 rounded-full text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
              filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <DataTable
      title="Leads"
      subtitle={`${OPPORTUNITIES.length} leads · ${renewals} renewal${renewals === 1 ? "" : "s"}`}
      columns={COLUMNS}
      rows={rows}
      getKey={(o) => o.id}
      onRowClick={(o) => drawers?.openPage({ kind: "lead", id: o.id })}
      toolbar={toolbar}
    />
  );
}
