"use client";

import { X } from "lucide-react";
import { useConversationLauncher } from "./conversation-launcher";
import { useDetailDrawers } from "./detail-drawers";
import { Button } from "@/components/ui/button";
import { kpiDetail, type KpiRecord, type KpiTone } from "@/lib/kpi-detail";
import type { KpiData } from "@/lib/dashboard-data";

/* Status chips, in the same vocabulary the contract tables use. */
const CHIP: Record<KpiTone, string> = {
  critical: "bg-status-critical text-white font-bold",
  warn: "border border-gray-400 text-gray-700",
  good: "border border-gray-200 text-gray-500",
};

/* Four columns: what it is, whose it is, what it contributes, where it stands. */
const GRID = "grid grid-cols-[minmax(0,2.4fr)_minmax(0,1.7fr)_9rem_minmax(0,7rem)] gap-4 items-baseline";

function Row({ record, onOpen }: { record: KpiRecord; onOpen: () => void }) {
  const drawers = useDetailDrawers();
  const clickable = !!record.link && !!drawers;

  const body = (
    <>
      <span className="text-sm text-gray-900 truncate">{record.title}</span>
      <span className="text-sm text-gray-500 truncate">{record.meta}</span>
      <span className="text-sm font-bold text-gray-900 text-right truncate">{record.value}</span>
      <span className="min-w-0">
        {record.status && (
          <span
            className={`inline-block max-w-full truncate align-middle text-[10px] px-2 py-0.5 rounded-full ${
              CHIP[record.tone ?? "good"]
            }`}
          >
            {record.status}
          </span>
        )}
      </span>
    </>
  );

  if (!clickable)
    return <div className={`${GRID} px-4 py-2.5 border-t border-gray-100`}>{body}</div>;

  return (
    <button
      type="button"
      onClick={() => {
        onOpen();
        const l = record.link!;
        if (l.kind === "asset") drawers!.openAsset(l.id);
        else if (l.kind === "lead") drawers!.openLead(l.id);
        else drawers!.openContract({ kind: l.kind, id: l.id });
      }}
      className={`${GRID} w-full text-left px-4 py-2.5 border-t border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer`}
    >
      {body}
    </button>
  );
}

/** The records behind a KPI, expanded under the strip: the records themselves
 *  as a table, and what HMAX suggests doing about them. */
export default function KpiRecords({ kpi, onClose }: { kpi: KpiData; onClose: () => void }) {
  const launch = useConversationLauncher();
  const detail = kpiDetail(kpi.id);
  if (!detail) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* What the number is made of */}
      <div className="flex items-start justify-between gap-4 px-4 pt-3.5 pb-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900">{kpi.label}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {detail.caption} · {detail.records.length}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="-mt-1 -mr-1 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>
      <div className={`${GRID} px-4 pb-2`}>
        {[detail.columns.title, detail.columns.meta, detail.columns.value, detail.columns.status].map((c, i) => (
          <span
            key={c + i}
            className={`text-[11px] text-gray-400 tracking-wider truncate ${i === 2 ? "text-right" : ""}`}
          >
            {c}
          </span>
        ))}
      </div>
      <div className="max-h-[296px] overflow-y-auto no-scrollbar">
        {detail.records.map((r) => (
          <Row key={r.id} record={r} onOpen={onClose} />
        ))}
        {detail.records.length === 0 && (
          <p className="px-4 py-8 text-sm text-gray-400 text-center border-t border-gray-100">Nothing to list right now.</p>
        )}
      </div>

      {/* What to do about it */}
      <div className="px-4 py-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-6">
        <div className="min-w-0">
          <p className="text-[11px] text-gray-400 tracking-wider">Recommended by HMAX</p>
          <p className="text-sm text-gray-700 mt-0.5">
            {detail.action.why}
            {detail.note ? ` ${detail.note}` : ""}
          </p>
        </div>
        <Button
          onClick={() => launch({ context: kpi.label, prompt: detail.action.prompt })}
          className="rounded-full h-auto px-5 py-2.5 text-sm shrink-0 cursor-pointer"
        >
          {detail.action.label}
        </Button>
      </div>
    </div>
  );
}
