"use client";

import { useState } from "react";
import DataTable, { type Column } from "@/components/dashboard/data-table";
import AssetDrawer from "@/components/dashboard/sales/asset-drawer";
import { REPORTS_AWAITING, type FieldReport } from "@/lib/field-reports-data";

function SignatureCell({ report }: { report: FieldReport }) {
  if (report.faultSignature) {
    return <span className="bg-status-critical text-white font-bold text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">Fault signature</span>;
  }
  return <span className="text-gray-300">-</span>;
}

function WaitingCell({ days }: { days: number }) {
  const cls = days >= 8 ? "bg-gray-200 text-gray-700" : "border border-gray-300 text-gray-500";
  return <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>{days}d</span>;
}

const COLUMNS: Column<FieldReport>[] = [
  { header: "Report", cell: (r) => <span className="text-gray-900">{r.code}</span> },
  { header: "Asset", cell: (r) => <span className="text-gray-700 underline underline-offset-2 decoration-gray-200">{r.asset}</span> },
  { header: "Type", cell: (r) => <span className="text-gray-500">{r.type}</span> },
  { header: "Finding", cell: (r) => <span className="text-gray-500">{r.finding}</span> },
  { header: "Engineer", cell: (r) => <span className="text-gray-500 whitespace-nowrap">{r.engineer}</span> },
  { header: "Waiting", cell: (r) => <WaitingCell days={r.waitingDays} /> },
  { header: "Signature", cell: (r) => <SignatureCell report={r} />, align: "right" },
];

export default function ReportsAwaiting() {
  const [drawerId, setDrawerId] = useState<string | null>(null);
  return (
    <>
      <AssetDrawer assetId={drawerId} onClose={() => setDrawerId(null)} />
      <DataTable
        title="Reports awaiting interpretation"
        subtitle={`${REPORTS_AWAITING.length} reports · review the asset to interpret`}
        columns={COLUMNS}
        rows={REPORTS_AWAITING}
        getKey={(r) => r.id}
        onRowClick={(r) => setDrawerId(r.assetId)}
      />
    </>
  );
}
