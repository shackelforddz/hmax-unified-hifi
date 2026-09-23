"use client";

import { useEffect, useState, useRef } from "react";
import { X, CheckCircle2, Circle, FileText, ChevronDown, Building2, Cpu, TrendingUp, TriangleAlert, RefreshCw, UserPlus, ExternalLink, Maximize2 } from "lucide-react";
import {
  ATTENTION_ITEMS,
  CUSTOMER_DETAILS,
  type CustomerDetail,
  type DocState,
  type RiskLevel,
  type InfoStatus,
} from "@/lib/dashboard-data";
import { Button } from "@/components/ui/button";
import { useConversationLauncher } from "./conversation-launcher";
import { AssetLink, ContractLink, useDrawerLayer, useDetailDrawers } from "@/components/dashboard/detail-drawers";
import ContextSummary from "@/components/dashboard/context-summary";
import HealthBar from "@/components/dashboard/health-bar";

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] text-gray-500 bg-gray-100 rounded px-1.5 py-0.5 whitespace-nowrap">
      {children}
    </span>
  );
}

function DocStateBadge({ state }: { state: DocState }) {
  const map: Record<DocState, { label: string; cls: string }> = {
    verified: { label: "Verified", cls: "bg-gray-900 text-white" },
    portal: { label: "Portal", cls: "bg-gray-100 text-gray-600" },
    conflicting: { label: "Conflicting", cls: "bg-status-critical-deep text-white font-bold" },
    missing: { label: "Missing", cls: "border border-status-critical text-status-critical font-bold" },
  };
  const { label, cls } = map[state];
  return <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>{label}</span>;
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const cls =
    level === "Critical" ? "bg-status-critical-deep text-white font-bold"
    : level === "High" ? "border border-status-critical text-status-critical font-bold"
    : "bg-gray-200 text-gray-700";
  return <span className={`text-[11px] px-3 py-0.5 rounded-full whitespace-nowrap ${cls}`}>{level}</span>;
}

function InfoBadge({ status }: { status: InfoStatus }) {
  const cls =
    status === "Conflicting" ? "bg-status-critical-deep text-white font-bold"
    : status === "Partial" ? "bg-gray-200 text-gray-700"
    : "border border-gray-300 text-gray-500";
  return <span className={`text-[11px] px-2.5 py-0.5 rounded-full whitespace-nowrap ${cls}`}>{status}</span>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">{children}</div>;
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-base text-gray-900">{children}</h3>
      {action && (
        <button className="text-xs text-gray-500 hover:text-gray-600 transition-colors cursor-pointer">{action}</button>
      )}
    </div>
  );
}

export function AttentionBody({ d, critical, onAction }: { d: CustomerDetail; critical: boolean; onAction: (prompt: string) => void }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Context summary */}
      <ContextSummary summary={d.contextSummary} critical={critical}>
        {d.recommendedActions && d.recommendedActions.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] text-gray-500 tracking-wider mb-2">Recommended by HMAX</p>
            <div className="flex flex-wrap gap-2">
              {d.recommendedActions.map((a) => (
                <Button
                  key={a}
                  onClick={() => onAction(a)}
                  className="rounded-full h-auto px-4 py-1.5 text-xs cursor-pointer"
                >
                  {a}
                </Button>
              ))}
            </div>
          </div>
        )}
      </ContextSummary>

      {/* Delivery & commercial status */}
      <Card>
        <SectionTitle>Delivery &amp; commercial status</SectionTitle>
        <div className="flex flex-col gap-2">
          {d.deliveryStatus.map((s) => (
            <div key={s.label} className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {s.done ? (
                  <CheckCircle2 size={15} className="text-gray-900 shrink-0" />
                ) : (
                  <Circle size={15} className="text-gray-500 shrink-0" />
                )}
                <span className="text-sm text-gray-700">{s.label}</span>
              </div>
              <div className="flex gap-3 shrink-0 text-xs text-gray-500 whitespace-nowrap">
                <span>planned {s.planned}</span>
                {s.actual && <span className="text-gray-600">actual {s.actual}</span>}
              </div>
            </div>
          ))}
        </div>

        {d.invoice && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 mt-4 flex flex-col gap-3">
            <div>
              <p className="text-[11px] text-gray-500 tracking-wider mb-1.5">Invoice readiness</p>
              <span className="text-xs bg-status-critical-deep text-white font-bold px-2 py-0.5 rounded-full">{d.invoice.readiness}</span>
            </div>
            <div>
              <p className="text-[11px] text-gray-500 tracking-wider mb-1">Blocker</p>
              <p className="text-sm text-gray-700">{d.invoice.blocker}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500 tracking-wider mb-1">Critical vendor</p>
              <p className="text-sm text-gray-700">{d.invoice.criticalVendor}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Ownership & dependencies */}
      <Card>
        <SectionTitle>Ownership &amp; dependencies</SectionTitle>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Current owner", value: d.ownership.currentOwner },
            { label: "Next owner", value: d.ownership.nextOwner },
            { label: "Handover status", value: d.ownership.handoverStatus },
          ].map((o) => (
            <div key={o.label}>
              <p className="text-[11px] text-gray-500 tracking-wider mb-1">{o.label}</p>
              <p className="text-sm text-gray-700 leading-snug">{o.value}</p>
            </div>
          ))}
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-[11px] text-gray-500 tracking-wider mb-3">Blockers &amp; dependencies</p>
          <div className="flex flex-col gap-4">
            {d.blockers.map((b, i) => (
              <div key={i}>
                <p className="text-sm text-gray-800 mb-0.5">{b.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{b.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Documents & data */}
      <Card>
        <SectionTitle>Documents &amp; data</SectionTitle>
        <p className="text-xs text-gray-500 mb-3">Provenance is shown for every record. Nothing is copied into this layer.</p>
        <div>
          <div className="grid grid-cols-[1fr_auto] gap-x-3 pb-2 border-b border-gray-200">
            <span className="text-[10px] text-gray-500 tracking-wider">Document</span>
            <span className="text-[10px] text-gray-500 tracking-wider text-right">State</span>
          </div>
          {d.documents.map((doc) => (
            <div key={doc.name} className="grid grid-cols-[1fr_auto] gap-x-3 py-2.5 items-center border-b border-gray-100">
              <div className="flex items-start gap-2 min-w-0">
                <FileText size={14} className="text-gray-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 truncate">{doc.name}</p>
                  <p className="text-xs text-gray-500">
                    {doc.type} · <span className="bg-gray-100 rounded px-1 py-0.5">{doc.source}</span> · {doc.updated}
                  </p>
                </div>
              </div>
              <DocStateBadge state={doc.state} />
            </div>
          ))}
        </div>
        <button className="text-xs text-gray-500 underline mt-3 hover:text-gray-700 transition-colors cursor-pointer">
          Request missing information
        </button>
      </Card>

      {/* Open risks */}
      <Card>
        <SectionTitle>Open risks on this object</SectionTitle>
        <div className="flex flex-col gap-4">
          {d.openRisks.map((r, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 mb-1">{r.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed mb-2">{r.detail}</p>
                <div className="flex flex-wrap gap-1.5">
                  {r.tags.map((t) => <Tag key={t}>{t}</Tag>)}
                </div>
              </div>
              <RiskBadge level={r.level} />
            </div>
          ))}
        </div>
      </Card>

      {/* Information completeness */}
      <Card>
        <SectionTitle action="Request missing information">Information completeness</SectionTitle>
        <p className="text-xs text-gray-500 mb-3">{d.infoCompleteness.summary}</p>
        <div className="flex flex-col">
          {d.infoCompleteness.rows.map((row) => (
            <div key={row.label} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-700">{row.label}</span>
              <InfoBadge status={row.status} />
              <Tag>{row.source}</Tag>
            </div>
          ))}
        </div>
      </Card>

      {/* Timeline */}
      <Card>
        <SectionTitle>Timeline</SectionTitle>
        <p className="text-xs text-gray-500 mb-4">Events drawn from every connected system, in one sequence</p>
        <div className="flex flex-col">
          {d.timeline.map((ev, i) => (
            <div key={i} className="flex gap-3 pb-4 last:pb-0">
              <div className="flex flex-col items-center shrink-0 pt-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                {i < d.timeline.length - 1 && <span className="w-px flex-1 bg-gray-200 mt-1" />}
              </div>
              <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-gray-800">{ev.title}</p>
                  <p className="text-xs text-gray-500 leading-snug">{ev.detail}</p>
                  <span className="inline-block mt-1"><Tag>{ev.source}</Tag></span>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">{ev.date}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Related */}
      <Card>
        <SectionTitle>Related</SectionTitle>
        <p className="text-xs text-gray-500 mb-4">The context around this object, not a copy of it.</p>
        <div className="flex flex-col gap-4">
          <RelatedGroup label="Customer" icon={<Building2 size={15} className="text-gray-500" />} refs={[d.related.customer]} />
          <RelatedGroup label="Contract" icon={<FileText size={15} className="text-gray-500" />} refs={[d.related.contract]} link="contract" />
          <RelatedGroup label="Assets" icon={<Cpu size={15} className="text-gray-500" />} refs={d.related.assets} link="asset" />
          <RelatedGroup label="Originating lead" icon={<TrendingUp size={15} className="text-gray-500" />} refs={[d.related.opportunity]} />
        </div>
      </Card>
    </div>
  );
}

function RelatedGroup({ label, icon, refs, link }: { label: string; icon: React.ReactNode; refs: { title: string; sub: string }[]; link?: "asset" | "contract" }) {
  return (
    <div>
      <p className="text-[11px] text-gray-500 tracking-wider mb-2">{label}</p>
      <div className="flex flex-col gap-2">
        {refs.map((r) => (
          <div key={r.title} className="flex items-start gap-3">
            <span className="shrink-0 mt-0.5">{icon}</span>
            <div>
              <p className="text-sm text-gray-800 leading-snug">{link === "asset" ? <AssetLink asset={r.title} /> : link === "contract" ? <ContractLink contract={r.title} /> : r.title}</p>
              <p className="text-xs text-gray-500">{r.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ACTIONS = [
  { label: "Escalate delivery risk", icon: TriangleAlert },
  { label: "Request vendor update", icon: RefreshCw },
  { label: "Assign owner", icon: UserPlus },
  { label: "Generate project status", icon: FileText },
  { label: "Open in SAP", icon: ExternalLink },
];

export function AttentionActions() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative flex-1" ref={ref}>
      <Button
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-full h-auto py-2.5 text-sm cursor-pointer"
      >
        Actions <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      {open && (
        <div className="absolute bottom-full mb-2 right-0 w-full min-w-[230px] bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-10 animate-pop-in">
          {ACTIONS.map(({ label, icon: Icon }) => (
            <Button
              key={label}
              variant="ghost"
              onClick={() => setOpen(false)}
              className="w-full justify-start gap-2.5 px-4 py-2.5 h-auto text-sm text-gray-700 rounded-none cursor-pointer"
            >
              <Icon size={15} strokeWidth={1.5} className="text-gray-500 shrink-0" />
              {label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  itemId: string | null;
  onClose: () => void;
}

export default function AttentionDrawer({ itemId, onClose }: Props) {
  const detail = itemId ? CUSTOMER_DETAILS[itemId] : null;
  const open = !!detail;
  const shell = useDrawerLayer(open);
  const launch = useConversationLauncher();
  const drawers = useDetailDrawers();

  const runAction = (prompt: string) => {
    onClose();
    launch({ context: detail?.name, prompt, entity: detail ? { kind: "customer", name: detail.name } : undefined });
  };

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} {...shell.backdrop} />

      {/* Drawer */}
      <div {...shell.panel}>
        {detail && (
          <>
            {/* Header */}
            <div className="shrink-0 px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl text-gray-900">{detail.name}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{detail.subtitle}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => drawers?.openPage({ kind: "attention", id: itemId! })}
                    aria-label="Open as a page"
                    title="Open as a page"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <Maximize2 size={15} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-x-8 gap-y-3 mt-4">
                {[
                  { label: "Owner", value: detail.stats.owner },
                  { label: "Value", value: detail.stats.value },
                  { label: "Margin", value: detail.stats.margin },
                  { label: "Schedule", value: detail.stats.schedule },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-[11px] text-gray-500 tracking-wider">{s.label}</p>
                    <p className="text-sm text-gray-800 mt-0.5">{s.value}</p>
                  </div>
                ))}
                <div>
                  <p className="text-[11px] text-gray-500 tracking-wider">Health</p>
                  <HealthBar
                    pct={detail.stats.healthPct}
                    className="flex items-center gap-2 mt-1.5"
                    trackClassName="w-16 h-2 bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-5 bg-white">
              <AttentionBody d={detail} critical={ATTENTION_ITEMS.find((a) => a.id === itemId)?.status === "critical"} onAction={runAction} />
            </div>

            {/* Footer */}
            <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-gray-100">
              <Button variant="outline" className="flex-1 rounded-full h-auto py-2.5 text-sm text-gray-700 cursor-pointer">
                Ask HMAX
              </Button>
              <AttentionActions />
            </div>
          </>
        )}
      </div>
    </>
  );
}
