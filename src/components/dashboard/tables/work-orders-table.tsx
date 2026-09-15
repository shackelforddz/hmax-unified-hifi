"use client";

import { useState } from "react";
import DataTable, { type Column } from "@/components/dashboard/data-table";
import WorkOrderDrawer, { StatusBadge, PriorityBadge } from "@/components/dashboard/work-order-drawer";
import { WORK_ORDERS, type WorkOrder } from "@/lib/work-orders-data";

const COLUMNS: Column<WorkOrder>[] = [
  { header: "Contract", cell: (w) => <span className="text-gray-900">{w.code}</span> },
  { header: "Title", cell: (w) => <span className="text-gray-700">{w.title}</span> },
  { header: "Asset", cell: (w) => <span className="text-gray-500">{w.asset}</span> },
  { header: "Type", cell: (w) => <span className="text-gray-500">{w.type}</span> },
  { header: "Priority", cell: (w) => <PriorityBadge priority={w.priority} /> },
  { header: "Status", cell: (w) => <StatusBadge status={w.status} /> },
  { header: "Assignee", cell: (w) => <span className="text-gray-500">{w.assignee}</span> },
  { header: "Due", cell: (w) => <span className="text-gray-500 whitespace-nowrap">{w.due}</span>, align: "right" },
];

export default function WorkOrdersTable({ title = "Contracts" }: { title?: string }) {
  const [drawerId, setDrawerId] = useState<string | null>(null);
  return (
    <>
      <WorkOrderDrawer workOrderId={drawerId} onClose={() => setDrawerId(null)} />
      <DataTable
        title={title}
        subtitle={`${WORK_ORDERS.length} contracts`}
        columns={COLUMNS}
        rows={WORK_ORDERS}
        getKey={(w) => w.id}
        onRowClick={(w) => setDrawerId(w.id)}
      />
    </>
  );
}
