"use client";

import { useEffect, useState, useRef } from "react";
import { X, ChevronDown, CheckCircle2, Circle, CalendarClock, ClipboardList, Package, UserPlus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConversationLauncher } from "@/components/dashboard/conversation-launcher";
import { WORK_ORDERS, WORK_ORDER_DETAILS, type WorkOrder, type WorkOrderDetail, type WoStatus, type WoPriority } from "@/lib/work-orders-data";
import { AssetLink, ContractLink, drawerLayer } from "@/components/dashboard/detail-drawers";
import ContextSummary from "@/components/dashboard/context-summary";

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">{children}</div>;
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base text-gray-900 mb-4">{children}</h3>;
}

const STATUS_LABEL: Record<WoStatus, string> = { open: "Open", scheduled: "Scheduled", "in-progress": "In progress", blocked: "Blocked", complete: "Complete" };

export function StatusBadge({ status }: { status: WoStatus }) {
  const cls =
    status === "blocked" ? "bg-gray-900 text-white"
    : status === "in-progress" ? "bg-gray-200 text-gray-700"
    : status === "complete" ? "border border-gray-300 text-gray-400"
    : "border border-gray-300 text-gray-600";
  return <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>{STATUS_LABEL[status]}</span>;
}

const PRIORITY_LABEL: Record<WoPriority, string> = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };
export function PriorityBadge({ priority }: { priority: WoPriority }) {
  const cls =
    priority === "critical" ? "bg-gray-900 text-white"
    : priority === "high" ? "bg-gray-700 text-white"
    : priority === "medium" ? "bg-gray-200 text-gray-700"
    : "border border-gray-300 text-gray-400";
  return <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>{PRIORITY_LABEL[priority]}</span>;
}

const PART_CLS: Record<string, string> = {
  "in-stock": "border border-gray-300 text-gray-500",
  ordered: "bg-gray-200 text-gray-700",
  backordered: "bg-gray-900 text-white",
};
const PART_LABEL: Record<string, string> = { "in-stock": "In stock", ordered: "Ordered", backordered: "Backordered" };

const ACTIONS = [
  { label: "Reschedule", icon: CalendarClock },
  { label: "Update status", icon: ClipboardList },
  { label: "Order parts", icon: Package },
  { label: "Reassign", icon: UserPlus },
  { label: "Open in SAP", icon: ExternalLink },
];

function ActionsMenu({ onAction }: { onAction: (label: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div className="relative flex-1" ref={ref}>
      <Button onClick={() => setOpen((o) => !o)} className="w-full rounded-full h-auto py-2.5 text-sm cursor-pointer">
        Actions <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>
      {open && (
        <div className="absolute bottom-full mb-2 right-0 w-full min-w-[220px] bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-10 animate-pop-in">
          {ACTIONS.map(({ label, icon: Icon }) => (
            <Button key={label} variant="ghost" onClick={() => { setOpen(false); onAction(label); }} className="w-full justify-start gap-2.5 px-4 py-2.5 h-auto text-sm text-gray-700 rounded-none cursor-pointer">
              <Icon size={15} strokeWidth={1.5} className="text-gray-400 shrink-0" />
              {label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

function DrawerBody({ w, d, onAction }: { w: WorkOrder; d: WorkOrderDetail; onAction: (p: string) => void }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Summary + actions */}
      <ContextSummary summary={d.summary} critical={w.priority === "critical"}>
        {d.recommendedActions.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] text-gray-400 tracking-wider mb-2">Recommended by HMAX</p>
            <div className="flex flex-wrap gap-2">
              {d.recommendedActions.map((a) => (
                <Button key={a} onClick={() => onAction(a)} className="rounded-full h-auto px-4 py-1.5 text-xs cursor-pointer">{a}</Button>
              ))}
            </div>
          </div>
        )}
      </ContextSummary>

      {/* Progress */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base text-gray-900">Progress</h3>
          <span className="text-xs text-gray-400">{w.progress}% complete · due {w.due}</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-chart-line rounded-full" style={{ width: `${w.progress}%` }} />
        </div>
      </Card>

      {/* Checklist */}
      <Card>
        <SectionTitle>Task checklist</SectionTitle>
        <div className="flex flex-col">
          {d.checklist.map((c) => (
            <div key={c.label} className="flex items-center gap-2.5 py-2 border-b border-gray-100 last:border-0">
              {c.done ? <CheckCircle2 size={15} className="text-gray-900 shrink-0" /> : <Circle size={15} className="text-gray-300 shrink-0" />}
              <span className={`text-sm ${c.done ? "text-gray-700" : "text-gray-500"}`}>{c.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Parts */}
      {d.parts.length > 0 && (
        <Card>
          <SectionTitle>Parts</SectionTitle>
          <div className="flex flex-col">
            {d.parts.map((p) => (
              <div key={p.label} className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700">{p.label} <span className="text-gray-400">×{p.qty}</span></span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${PART_CLS[p.status]}`}>{PART_LABEL[p.status]}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <SectionTitle>Timeline</SectionTitle>
        <div className="flex flex-col">
          {d.timeline.map((t, i) => (
            <div key={i} className="flex gap-3 pb-4 last:pb-0">
              <div className="flex flex-col items-center shrink-0 pt-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                {i < d.timeline.length - 1 && <span className="w-px flex-1 bg-gray-200 mt-1" />}
              </div>
              <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                <p className="text-sm text-gray-800">{t.label}</p>
                <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">{t.date}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Related */}
      <Card>
        <SectionTitle>Related</SectionTitle>
        <div className="flex flex-col gap-3">
          {[
            { label: "Asset", value: <AssetLink asset={d.related.asset} /> },
            { label: "Customer", value: d.related.customer },
            { label: "Contract", value: <ContractLink contract={d.related.contract} customer={d.related.customer} /> },
          ].map((r) => (
            <div key={r.label}>
              <p className="text-[11px] text-gray-400 tracking-wider">{r.label}</p>
              <p className="text-sm text-gray-800 mt-0.5">{r.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

interface Props {
  workOrderId: string | null;
  onClose: () => void;
}

export default function WorkOrderDrawer({ workOrderId, onClose }: Props) {
  const w = workOrderId ? WORK_ORDERS.find((x) => x.id === workOrderId) ?? null : null;
  const d = workOrderId ? WORK_ORDER_DETAILS[workOrderId] ?? null : null;
  const open = !!w;
  const shell = drawerLayer(open);
  const launch = useConversationLauncher();

  const runAction = (prompt: string) => {
    onClose();
    launch({ context: w?.code, prompt });
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div onClick={onClose} {...shell.backdrop} />
      <div {...shell.panel}>
        {w && (
          <>
            <div className="shrink-0 px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl text-gray-900">{w.code}</h2>
                  <p className="text-sm text-gray-400 mt-0.5">{w.title}</p>
                </div>
                <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-3 mt-4">
                {[
                  { label: "Status", value: STATUS_LABEL[w.status] },
                  { label: "Priority", value: PRIORITY_LABEL[w.priority] },
                  { label: "Type", value: w.type },
                  { label: "Assignee", value: w.assignee },
                  { label: "Asset", value: <AssetLink asset={w.asset} /> },
                  { label: "Due", value: w.due },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-[11px] text-gray-400 tracking-wider">{s.label}</p>
                    <p className="text-sm text-gray-800 mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-5 bg-white">
              {d ? (
                <DrawerBody w={w} d={d} onAction={runAction} />
              ) : (
                <p className="text-sm text-gray-400">No further detail recorded for this contract yet.</p>
              )}
            </div>

            <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => runAction(`Tell me about contract ${w.code}`)} className="flex-1 rounded-full h-auto py-2.5 text-sm text-gray-700 cursor-pointer">
                Create A Conversation
              </Button>
              <ActionsMenu onAction={(label) => runAction(`${label} for contract ${w.code}`)} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
