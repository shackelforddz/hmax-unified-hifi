"use client";

import { useEffect, useState, useRef } from "react";
import { X, ChevronDown, CheckCircle2, Circle, CalendarClock, ClipboardList, RefreshCw, UserPlus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConversationLauncher } from "@/components/dashboard/conversation-launcher";
import { OPS_CONTRACTS, OPS_CONTRACT_DETAILS, type OpsContract, type OpsContractDetail, type RiskProfile } from "@/lib/operations-data";
import { SCOPE_REVIEWS } from "@/lib/reliability-data";
import ContractSections from "./contract-sections";
import { drawerLayer } from "@/components/dashboard/detail-drawers";

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">{children}</div>;
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base text-gray-900 mb-4">{children}</h3>;
}

const RISK_CLS: Record<string, string> = {
  high: "bg-gray-900 text-white",
  med: "bg-gray-200 text-gray-700",
  low: "border border-gray-300 text-gray-500",
};
const RISK_LABEL: Record<string, string> = { high: "High", med: "Med", low: "Low" };

function RiskProfileView({ risk }: { risk: RiskProfile }) {
  const rows: [string, keyof RiskProfile][] = [
    ["Schedule", "schedule"],
    ["Cost", "cost"],
    ["Quality", "quality"],
    ["Safety", "safety"],
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {rows.map(([label, key]) => (
        <div key={key} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2">
          <span className="text-sm text-gray-600">{label}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${RISK_CLS[risk[key]]}`}>{RISK_LABEL[risk[key]]}</span>
        </div>
      ))}
    </div>
  );
}

const ACTIONS = [
  { label: "Adjust schedule", icon: CalendarClock },
  { label: "Raise change order", icon: ClipboardList },
  { label: "Rebalance crew", icon: RefreshCw },
  { label: "Assign owner", icon: UserPlus },
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
        <div className="absolute bottom-full mb-2 right-0 w-full min-w-[220px] bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-10 animate-message-in">
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

function DrawerBody({ c, d, onAction }: { c: OpsContract; d: OpsContractDetail; onAction: (p: string) => void }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Progress */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base text-gray-900">Progress</h3>
          <span className="text-xs text-gray-400">{c.progress}% of term elapsed</span>
        </div>
        <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-chart-line rounded-full" style={{ width: `${c.progress}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-2">Contract term {c.start} → {c.end}</p>
      </Card>

      {/* Context summary + recommended actions */}
      <Card>
        <SectionTitle>Context summary</SectionTitle>
        <p className="text-sm text-gray-500 leading-relaxed">{d.summary}</p>
        {d.recommendedActions.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] text-gray-400 tracking-wider mb-2">Recommended actions</p>
            <div className="flex flex-wrap gap-2">
              {d.recommendedActions.map((a) => (
                <Button key={a} onClick={() => onAction(a)} className="rounded-full h-auto px-4 py-1.5 text-xs cursor-pointer">{a}</Button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Risk profile */}
      <Card>
        <SectionTitle>Risk profile</SectionTitle>
        <RiskProfileView risk={c.risk} />
        {(() => {
          const review = SCOPE_REVIEWS.find((r) => r.contractId === c.id);
          if (!review) return null;
          const cls =
            review.verdict === "not-feasible" ? "bg-gray-900 text-white"
            : review.verdict === "at-risk" ? "bg-gray-200 text-gray-700"
            : review.verdict === "pending" ? "border border-gray-400 text-gray-700"
            : "border border-gray-300 text-gray-500";
          const label =
            review.verdict === "not-feasible" ? "Not feasible"
            : review.verdict === "at-risk" ? "At risk"
            : review.verdict === "pending" ? "Awaiting review"
            : "Feasible";
          return (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <p className="text-[11px] text-gray-400 tracking-wider">Scope feasibility</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>{label}</span>
              </div>
              <p className="text-sm text-gray-700">{review.scope} · {review.value}</p>
              <p className="text-xs text-gray-500 leading-relaxed mt-1">{review.detail}</p>
              <p className="text-xs text-gray-400 mt-1.5">Reviewed against handover from {review.from}</p>
            </div>
          );
        })()}
      </Card>

      {/* Milestones */}
      <Card>
        <SectionTitle>Milestones</SectionTitle>
        <div className="flex flex-col gap-2">
          {d.milestones.map((m) => (
            <div key={m.label} className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {m.done ? <CheckCircle2 size={15} className="text-gray-900 shrink-0" /> : <Circle size={15} className="text-gray-300 shrink-0" />}
                <span className="text-sm text-gray-700">{m.label}</span>
              </div>
              <div className="flex gap-3 shrink-0 text-xs text-gray-400 whitespace-nowrap">
                <span>planned {m.planned}</span>
                {m.actual && <span className="text-gray-600">actual {m.actual}</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <ContractSections d={d} />

      {/* Related */}
      <Card>
        <SectionTitle>Related</SectionTitle>
        <div className="flex flex-col gap-3">
          {[
            { label: "Customer", value: d.related.customer },
            { label: "Contract value", value: d.related.value },
            { label: "Region", value: d.related.region },
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


/** An optional "back" trail shown above the title, for a drawer that was
 *  opened by drilling out of another one. */
interface Props {
  contractId: string | null;
  onClose: () => void;
  /** Stack depth when opened over another drawer (see DetailDrawerProvider). */
  layer?: number;
  /** Keep the content mounted but slid off-screen, for enter/exit animation. */
  hidden?: boolean;
}

export default function ContractDrawer({ contractId, onClose, layer, hidden }: Props) {
  const c = contractId ? OPS_CONTRACTS.find((x) => x.id === contractId) ?? null : null;
  const d = contractId ? OPS_CONTRACT_DETAILS[contractId] ?? null : null;
  const open = !!(c && d) && !hidden;
  const stacked = layer !== undefined;
  const shell = drawerLayer(open, layer);
  const launch = useConversationLauncher();

  const runAction = (prompt: string) => {
    onClose();
    launch({ context: c?.customer, prompt, entity: contractId ? { kind: "contract", id: contractId } : undefined });
  };

  useEffect(() => {
    // Stacked drawers leave Escape to the provider, which closes the top one.
    if (!open || stacked) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, stacked]);

  return (
    <>
      <div onClick={onClose} {...shell.backdrop} />
      <div {...shell.panel}>
        {c && d && (
          <>
            <div className="shrink-0 px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl text-gray-900">{c.name}</h2>
                  <p className="text-sm text-gray-400 mt-0.5">{c.customer} · {c.value}</p>
                </div>
                <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-3 mt-4">
                {[
                  { label: "Status", value: c.status === "critical" ? "Critical" : "At risk" },
                  { label: "Owner", value: c.owner },
                  { label: "Progress", value: `${c.progress}%` },
                  { label: "Value", value: c.value },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-[11px] text-gray-400 tracking-wider">{s.label}</p>
                    <p className="text-sm text-gray-800 mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-5 bg-white">
              <DrawerBody c={c} d={d} onAction={runAction} />
            </div>

            <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => runAction(`Tell me about the ${c.name} contract`)} className="flex-1 rounded-full h-auto py-2.5 text-sm text-gray-700 cursor-pointer">
                Create A Conversation
              </Button>
              <ActionsMenu onAction={(label) => runAction(`${label} for ${c.name}`)} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
