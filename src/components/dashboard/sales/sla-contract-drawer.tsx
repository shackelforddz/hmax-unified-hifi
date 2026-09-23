"use client";

import { useEffect, useState, useRef } from "react";
import { X, ChevronDown, Check, Circle, FileText, RefreshCw, TrendingUp, UserPlus, ExternalLink, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConversationLauncher } from "@/components/dashboard/conversation-launcher";
import { SLA_CONTRACTS, type SlaContractDetail, type SlaBadge } from "@/lib/sales-data";
import ContractSections from "@/components/dashboard/operations/contract-sections";
import { AssetLink, useDrawerLayer, useDetailDrawers } from "@/components/dashboard/detail-drawers";
import ContextSummary from "@/components/dashboard/context-summary";

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">{children}</div>;
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base text-gray-900 mb-4">{children}</h3>;
}

function Badge({ badge }: { badge: SlaBadge }) {
  if (badge.verified) {
    return (
      <span className="inline-flex items-center gap-1 bg-status-critical-deep text-white font-bold text-[11px] px-3 py-0.5 rounded-full whitespace-nowrap">
        <Check size={10} strokeWidth={2.5} /> {badge.label}
      </span>
    );
  }
  return <span className="border border-gray-400 text-gray-700 text-[11px] px-3 py-0.5 rounded-full whitespace-nowrap">{badge.label}</span>;
}

const ACTIONS = [
  { label: "Prepare renewal", icon: RefreshCw },
  { label: "Build service report", icon: FileText },
  { label: "Flag SLA risk", icon: TrendingUp },
  { label: "Assign owner", icon: UserPlus },
  { label: "Open in SAP", icon: ExternalLink },
];

export function SlaActions({ onAction }: { onAction: (label: string) => void }) {
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
              <Icon size={15} strokeWidth={1.5} className="text-gray-500 shrink-0" />
              {label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SlaBody({ d, onAction }: { d: SlaContractDetail; onAction: (p: string) => void }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <ContextSummary summary={d.summary} critical={d.risk.label === "Critical"} />

      {/* Status */}
      <Card>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <p className="text-[11px] text-gray-500 tracking-wider mb-1">Service health</p>
            <Badge badge={d.serviceHealth} />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 tracking-wider mb-1">Renewal risk</p>
            <Badge badge={d.risk} />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 tracking-wider">SLA</p>
            <p className="text-sm text-gray-800 mt-0.5">{d.slaActual} / {d.slaTarget}</p>
          </div>
        </div>
      </Card>

      {/* SLA metrics */}
      <Card>
        <SectionTitle>SLA performance</SectionTitle>
        <div className="flex flex-col">
          {d.metrics.map((m) => (
            <div key={m.label} className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-600">{m.label}</span>
              <span className="text-sm text-gray-900 text-right">{m.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Obligations */}
      <Card>
        <SectionTitle>Contract obligations</SectionTitle>
        <div className="flex flex-col">
          {d.obligations.map((o) => (
            <div key={o.label} className="flex items-center gap-2.5 py-2 border-b border-gray-100 last:border-0">
              {o.met ? <Check size={15} className="text-gray-900 shrink-0" /> : <Circle size={15} className="text-gray-500 shrink-0" />}
              <span className={`text-sm ${o.met ? "text-gray-700" : "text-gray-500"}`}>{o.label}</span>
              {!o.met && <span className="ml-auto text-[10px] border border-status-critical text-status-critical font-bold rounded-full px-2 py-0.5">At risk</span>}
            </div>
          ))}
        </div>
      </Card>

      {/* Shared contract detail - same as the ops contract drawers */}
      <ContractSections d={d} />

      {/* Related */}
      <Card>
        <SectionTitle>Related</SectionTitle>
        <div className="flex flex-col gap-3">
          {[
            { label: "Customer", value: d.related.customer },
            {
              label: "Assets",
              value: d.related.assets.split(", ").map((code, i) => (
                <span key={code}>
                  {i > 0 && ", "}
                  <AssetLink asset={code} />
                </span>
              )),
            },
            { label: "Contract", value: d.related.contract },
            { label: "Region", value: d.region },
          ].map((r) => (
            <div key={r.label}>
              <p className="text-[11px] text-gray-500 tracking-wider">{r.label}</p>
              <p className="text-sm text-gray-800 mt-0.5">{r.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

interface Props {
  contractId: string | null;
  onClose: () => void;
  /** Stack depth when opened over another drawer (see DetailDrawerProvider). */
  layer?: number;
  /** Keep the content mounted but slid off-screen, for enter/exit animation. */
  hidden?: boolean;
}

export default function SlaContractDrawer({ contractId, onClose, layer, hidden }: Props) {
  const d = contractId ? SLA_CONTRACTS[contractId] ?? null : null;
  const open = !!d && !hidden;
  const stacked = layer !== undefined;
  const shell = useDrawerLayer(open, layer);
  const launch = useConversationLauncher();
  const drawers = useDetailDrawers();

  const runAction = (prompt: string) => {
    onClose();
    launch({ context: d?.account, prompt, entity: d ? { kind: "customer", name: d.account } : undefined });
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
        {d && (
          <>
            <div className="shrink-0 px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl text-gray-900">{d.account}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{d.agreement}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => drawers?.openPage({ kind: "sla", id: contractId! })}
                    aria-label="Open as a page"
                    title="Open as a page"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <Maximize2 size={15} strokeWidth={1.5} />
                  </button>
                  <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-3 mt-4">
                {[
                  { label: "Value", value: d.value },
                  { label: "Term", value: d.term },
                  { label: "Renews in", value: d.renewsIn },
                  { label: "Owner", value: d.owner },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-[11px] text-gray-500 tracking-wider">{s.label}</p>
                    <p className="text-sm text-gray-800 mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-5 bg-white">
              <SlaBody d={d} onAction={runAction} />
            </div>

            <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => runAction(`Tell me about the ${d.account} service agreement`)} className="flex-1 rounded-full h-auto py-2.5 text-sm text-gray-700 cursor-pointer">
                Ask HMAX
              </Button>
              <SlaActions onAction={(label) => runAction(`${label} for the ${d.account} service agreement`)} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
