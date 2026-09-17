"use client";

import { useEffect, useRef, useState } from "react";
import { useConversationLauncher } from "./conversation-launcher";
import { useDetailDrawers } from "./detail-drawers";
import { Button } from "@/components/ui/button";
import type { KpiDetail, KpiRecord, KpiTone } from "@/lib/kpi-detail";

const TONE: Record<KpiTone, string> = {
  critical: "text-status-critical",
  warn: "text-amber-600",
  good: "text-gray-500",
};

const WIDTH = 380;

/** One record behind the KPI. Rows that name a contract, asset or agreement
 *  open its detail drawer; the rest are plain. */
function Row({ record, onOpen }: { record: KpiRecord; onOpen: () => void }) {
  const drawers = useDetailDrawers();
  const clickable = !!record.link && !!drawers;

  const body = (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-bold text-gray-900 truncate">{record.title}</span>
        {record.value && <span className="text-xs font-bold text-gray-900 shrink-0">{record.value}</span>}
      </div>
      {(record.meta || record.status) && (
        <div className="flex items-baseline justify-between gap-3 mt-0.5">
          <span className="text-[11px] text-gray-500 truncate">{record.meta}</span>
          {record.status && (
            <span className={`text-[11px] shrink-0 ${TONE[record.tone ?? "good"]}`}>{record.status}</span>
          )}
        </div>
      )}
    </>
  );

  if (!clickable) return <div className="px-3 py-2 border-b border-gray-100 last:border-0">{body}</div>;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
        const l = record.link!;
        if (l.kind === "asset") drawers!.openAsset(l.id);
        else if (l.kind === "lead") drawers!.openLead(l.id);
        else drawers!.openContract({ kind: l.kind, id: l.id });
      }}
      className="w-full text-left px-3 py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
    >
      {body}
    </button>
  );
}

/** The records behind a KPI, opened by clicking its card. */
export default function KpiPanel({
  label,
  value,
  detail,
  onClose,
}: {
  label: string;
  value: string;
  detail: KpiDetail;
  onClose: () => void;
}) {
  const launch = useConversationLauncher();
  const ref = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);

  // The last card in a strip would otherwise push the panel past the edge of
  // the dashboard - which is narrower than the window, with the conversation
  // column beside it. Keep it inside the grid the KPI strip is laid out on.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const bounds = el.closest(".grid")?.getBoundingClientRect();
    const right = Math.min(bounds?.right ?? Infinity, window.innerWidth - 12);
    const left = Math.max(bounds?.left ?? 0, 12);
    const r = el.getBoundingClientRect();
    let next = r.right > right ? right - r.right : 0;
    // A panel wider than the grid stays pinned to its left edge.
    if (r.left + next < left) next = left - r.left;
    if (next !== 0) setShift(next);
  }, []);

  return (
    <div
      ref={ref}
      data-kpi-panel
      style={{ width: WIDTH, marginLeft: shift }}
      className="absolute left-0 top-full mt-2 z-50 bg-white rounded-xl border border-gray-200 shadow-xl cursor-default animate-message-in"
    >
      {/* What is being listed */}
      <div className="px-3.5 pt-3 pb-2.5 border-b border-gray-100">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs font-bold text-gray-900">{label}</span>
          <span className="text-xs font-bold text-gray-900 shrink-0">{value}</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {detail.caption} · {detail.records.length}
        </p>
      </div>

      {/* The records themselves */}
      <div className="max-h-[248px] overflow-y-auto no-scrollbar">
        {detail.records.map((r) => (
          <Row key={r.id} record={r} onOpen={onClose} />
        ))}
        {detail.records.length === 0 && (
          <p className="px-3 py-6 text-xs text-gray-400 text-center">Nothing to list right now.</p>
        )}
      </div>

      {/* What to do about it */}
      <div className="p-3.5 border-t border-gray-100">
        {detail.note && <p className="text-[11px] text-gray-500 leading-4 pb-2.5">{detail.note}</p>}
        <div className="bg-gray-50 rounded-lg p-3 flex flex-col gap-2">
          <span className="text-[11px] text-gray-400 tracking-wider">Recommended by HMAX</span>
          <p className="text-[11px] text-gray-600 leading-4">{detail.action.why}</p>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
              launch({ context: label, prompt: detail.action.prompt });
            }}
            className="rounded-full self-start cursor-pointer"
          >
            {detail.action.label}
          </Button>
        </div>
      </div>
    </div>
  );
}
