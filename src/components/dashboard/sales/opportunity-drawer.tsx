"use client";

import { useEffect, useState, useRef } from "react";
import { X, ChevronDown, Check, Circle, Cpu, FileText, ClipboardCheck, UserPlus, ArrowUpRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConversationLauncher } from "@/components/dashboard/conversation-launcher";
import { OPP_STAGES, OPPORTUNITIES, leadMeta, type Opportunity, type OpportunityDetail } from "@/lib/sales-data";
import OwnerBadge from "./owner-badge";
import DocumentViewer, { type ViewDoc } from "./document-viewer";

// The lead rendered as a full brief document.
function opportunityDoc(opp: Opportunity, detail: OpportunityDetail): ViewDoc {
  const readyCount = opp.requirements.filter((r) => r.done).length;
  const statusLabel = opp.status === "on-track" ? "On track" : opp.status === "at-risk" ? "At risk" : "Stalled";
  return {
    kind: "contract",
    docType: "Lead brief",
    title: `${opp.account} - ${opp.title}`,
    ref: opp.id.toUpperCase(),
    preview: "text",
    fields: [
      { label: "Account", value: opp.account },
      { label: "Stage", value: opp.stage },
      { label: "Status", value: statusLabel },
      ...leadMeta(opp),
      { label: "Offer readiness", value: `${readyCount} of ${opp.requirements.length}` },
    ],
    sections: [
      { heading: "Summary", text: detail.summary },
      {
        heading: "Offer readiness",
        table: {
          columns: ["Input", "Owner", "Status"],
          rows: opp.requirements.map((r) => [r.label, r.owner, r.done ? "Provided" : "Missing"]),
        },
      },
      ...(detail.recommendations.length > 0
        ? [{ heading: "Recommendations", text: detail.recommendations.map((r) => `• ${r}`).join("\n") }]
        : []),
      {
        heading: "Assets in scope",
        text: detail.assets.length > 0 ? detail.assets.map((a) => `${a.code} - ${a.note}`).join("; ") : "None scoped yet - still in discovery.",
      },
    ],
  };
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">{children}</div>;
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base text-gray-900 mb-4">{children}</h3>;
}

function StageProgress({ current }: { current: string }) {
  const idx = OPP_STAGES.indexOf(current as (typeof OPP_STAGES)[number]);
  return (
    <div className="flex items-center gap-1.5">
      {OPP_STAGES.map((s, i) => (
        <div key={s} className="flex-1">
          <div className={`h-1.5 rounded-full ${i <= idx ? "bg-gray-900" : "bg-gray-200"}`} />
          <p className={`text-[10px] mt-1 text-center ${i === idx ? "text-gray-900" : "text-gray-400"}`}>{s}</p>
        </div>
      ))}
    </div>
  );
}

const ACTIONS = [
  { label: "Request missing info", icon: ClipboardCheck },
  { label: "Build offer", icon: FileText },
  { label: "Advance stage", icon: ArrowUpRight },
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
            <Button
              key={label}
              variant="ghost"
              onClick={() => { setOpen(false); onAction(label); }}
              className="w-full justify-start gap-2.5 px-4 py-2.5 h-auto text-sm text-gray-700 rounded-none cursor-pointer"
            >
              <Icon size={15} strokeWidth={1.5} className="text-gray-400 shrink-0" />
              {label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

function DrawerBody({ opp, detail, onAction }: { opp: Opportunity; detail: OpportunityDetail; onAction: (prompt: string) => void }) {
  const readyCount = opp.requirements.filter((r) => r.done).length;
  return (
    <div className="flex flex-col gap-4">
      {/* Stage progress */}
      <Card>
        <SectionTitle>Pipeline stage</SectionTitle>
        <StageProgress current={opp.stage} />
      </Card>

      {/* Bid cycle - the same meta the alert card shows, laid out to read */}
      <Card>
        <SectionTitle>Bid cycle</SectionTitle>
        <div className="grid grid-cols-3 gap-x-6 gap-y-4">
          {leadMeta(opp).map((m) => (
            <div key={m.label}>
              <p className="text-[11px] text-gray-400 tracking-wider">{m.label}</p>
              <p className="text-sm text-gray-800 mt-0.5 break-words">{m.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Summary + recommendations */}
      <Card>
        <SectionTitle>Context summary</SectionTitle>
        <p className="text-sm text-gray-500 leading-relaxed">{detail.summary}</p>
        {detail.recommendations.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] text-gray-400 tracking-wider mb-2">Recommendations</p>
            <div className="flex flex-col gap-2">
              {detail.recommendations.map((r, i) => (
                <div key={i} className="flex gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0 mt-1.5" />
                  <p className="text-sm text-gray-600 leading-snug">{r}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Offer readiness checklist */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base text-gray-900">Offer readiness</h3>
          <span className="text-xs text-gray-400">{readyCount} of {opp.requirements.length} complete</span>
        </div>
        <div className="flex flex-col">
          {opp.requirements.map((r) => (
            <div key={r.label} className="flex items-center gap-2.5 py-2 border-b border-gray-100 last:border-0">
              {r.done ? (
                <Check size={15} className="text-gray-900 shrink-0" />
              ) : (
                <Circle size={15} className="text-gray-300 shrink-0" />
              )}
              <span className={`text-sm ${r.done ? "text-gray-700" : "text-gray-500"}`}>{r.label}</span>
              <span className="ml-auto flex items-center gap-2 shrink-0">
                <OwnerBadge owner={r.owner} />
                {!r.done && <span className="text-[10px] text-gray-500 border border-gray-200 rounded-full px-2 py-0.5">Missing</span>}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Assets involved */}
      <Card>
        <SectionTitle>Assets involved</SectionTitle>
        {detail.assets.length > 0 ? (
          <div className="flex flex-col gap-2">
            {detail.assets.map((a) => (
              <div key={a.code} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-white border border-gray-100 flex items-center justify-center shrink-0">
                  <Cpu size={15} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-800">{a.code}</p>
                  <p className="text-xs text-gray-400">{a.note}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No specific assets scoped yet - still in discovery.</p>
        )}
      </Card>

      {/* Related */}
      <Card>
        <SectionTitle>Related</SectionTitle>
        <div className="flex flex-col gap-3">
          {[
            { label: "Customer", value: detail.related.customer },
            { label: "Contract", value: detail.related.contract },
            { label: "Region", value: detail.related.region },
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
  opp: Opportunity | null;
  detail: OpportunityDetail | null;
  onClose: () => void;
}

export default function OpportunityDrawer({ opp, detail, onClose }: Props) {
  const open = !!(opp && detail);
  const launch = useConversationLauncher();
  const [viewDoc, setViewDoc] = useState<ViewDoc | null>(null);

  const runAction = (prompt: string) => {
    onClose();
    // Only known leads have a context-pane record; proposed ones
    // (prop-*) fall back to customer detection like before.
    const known = opp && OPPORTUNITIES.some((o) => o.id === opp.id);
    launch({ context: opp?.account, prompt, entity: known ? { kind: "opportunity", id: opp!.id } : undefined });
  };

  // Close the document viewer when the drawer itself closes.
  useEffect(() => {
    if (!open) setViewDoc(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-[520px] max-w-[92vw] bg-white shadow-2xl flex flex-col transition-transform duration-500 ease-in-out font-patrick-hand ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {opp && detail && (
          <>
            {/* Header */}
            <div className="shrink-0 px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h2 className="text-2xl text-gray-900">{opp.account}</h2>
                  <p className="text-sm text-gray-400 mt-0.5">{opp.title}</p>
                  <button
                    onClick={() => setViewDoc(opportunityDoc(opp, detail))}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-600 underline underline-offset-2 decoration-gray-300 hover:decoration-gray-700 cursor-pointer transition-colors"
                  >
                    <FileText size={13} strokeWidth={1.5} />
                    View full document
                  </button>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-3 mt-4">
                {[
                  { label: "Stage", value: opp.stage },
                  { label: "Status", value: opp.status === "on-track" ? "On track" : opp.status === "at-risk" ? "At risk" : "Stalled" },
                  ...leadMeta(opp),
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-[11px] text-gray-400 tracking-wider">{s.label}</p>
                    <p className="text-sm text-gray-800 mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-5 bg-white">
              <DrawerBody opp={opp} detail={detail} onAction={runAction} />
            </div>

            {/* Footer */}
            <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => runAction(`Tell me about the ${opp.account} lead`)}
                className="flex-1 rounded-full h-auto py-2.5 text-sm text-gray-700 cursor-pointer"
              >
                Create A Conversation
              </Button>
              <ActionsMenu onAction={(label) => runAction(`${label} for the ${opp.account} lead`)} />
            </div>
          </>
        )}
      </div>

      {/* Full lead document */}
      <DocumentViewer
        doc={viewDoc}
        onClose={() => setViewDoc(null)}
        onAsk={(d) => {
          setViewDoc(null);
          onClose();
          const known = opp && OPPORTUNITIES.some((o) => o.id === opp.id);
          launch({ context: opp?.account, prompt: `Walk me through the ${opp?.account} lead brief`, entity: known ? { kind: "opportunity", id: opp!.id } : undefined });
        }}
      />
    </>
  );
}
