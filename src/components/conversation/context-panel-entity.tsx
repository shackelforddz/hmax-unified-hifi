"use client";

import { useState, useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import type { ContextEntity } from "@/components/dashboard/conversation-launcher";
import {
  ASSET_CONDITION,
  OPPORTUNITIES,
  OPPORTUNITY_DETAILS,
  OPP_STAGES,
} from "@/lib/sales-data";
import { OPS_CONTRACTS, OPS_CONTRACT_DETAILS, type RiskProfile } from "@/lib/operations-data";
import { getAssetDetail } from "@/lib/asset-lookup";
import { ASSET_NAMEPLATE } from "@/lib/asset-nameplate-data";
// Asset condition visuals are rendered inside the shared DrawerBody.
import {
  DrawerBody,
  DocumentsTab,
  ServiceHistoryTab,
  DRAWER_TABS,
  type DrawerTab,
} from "@/components/dashboard/sales/asset-drawer";
import DocumentViewer, { type ViewDoc } from "@/components/dashboard/sales/document-viewer";
import OwnerBadge from "@/components/dashboard/sales/owner-badge";
import ContextPanel from "./context-panel";

/* ── Shared shell + helpers ──────────────────────────────────────── */
function Shell({ title, subtitle, kind, belowHeader, children }: { title: string; subtitle?: string; kind: string; belowHeader?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="w-full h-full shrink-0 bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden">
      <div className="px-6 pt-6 pb-4 flex flex-col gap-1">
        <span className="text-sm leading-none text-gray-500">{kind}</span>
        <h1 className="text-[28px] leading-[34px] text-gray-950">{title}</h1>
        {subtitle && <p className="text-sm leading-5 text-gray-500">{subtitle}</p>}
      </div>
      {belowHeader}
      <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-4 no-scrollbar">{children}</div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="shrink-0 bg-white border border-gray-200 rounded-[10px] p-6 flex flex-col gap-4">{children}</div>;
}
/* Context summary card - red alert state when the record is critical,
   matching the detail drawers. */
function SummaryCard({ critical, children }: { critical: boolean; children: React.ReactNode }) {
  if (!critical) {
    return (
      <Card>
        <SectionTitle>Context summary</SectionTitle>
        {children}
      </Card>
    );
  }
  return (
    <div role="alert" className="shrink-0 bg-red-50 border border-status-critical/40 rounded-[10px] p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm leading-5 text-status-critical">
          <TriangleAlert size={16} strokeWidth={2} className="shrink-0" />
          Context summary
        </h3>
        <Badge label="Critical" urgent />
      </div>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm leading-5 text-gray-950">{children}</h3>;
}
function Stats({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((s) => (
        <div key={s.label} className="flex flex-col items-start gap-1">
          <p className="text-xs leading-4 text-gray-500">{s.label}</p>
          <div className="text-sm leading-5 font-bold text-gray-950">{s.value}</div>
        </div>
      ))}
    </div>
  );
}

/* Badges - red for the levels that need action, soft grey otherwise. */
function Badge({ label, urgent }: { label: string; urgent: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs leading-4 font-bold whitespace-nowrap shrink-0 ${
        urgent ? "bg-status-critical-deep text-white" : "bg-[#f5f5f5] text-gray-900"
      }`}
    >
      {label}
    </span>
  );
}

const RISK_LABEL: Record<string, string> = { high: "High", med: "Med", low: "Low" };
function RiskProfileView({ risk }: { risk: RiskProfile }) {
  const rows: [string, keyof RiskProfile][] = [
    ["Schedule", "schedule"],
    ["Cost", "cost"],
    ["Quality", "quality"],
    ["Safety", "safety"],
  ];
  return (
    <div className="flex flex-col gap-2">
      {rows.map(([label, key]) => (
        <div key={key} className="flex items-start justify-between bg-white border border-gray-200 rounded-lg p-4">
          <span className="text-sm leading-5 text-gray-950">{label}</span>
          <Badge label={RISK_LABEL[risk[key]]} urgent={risk[key] === "high"} />
        </div>
      ))}
    </div>
  );
}

/* ── Asset - mirrors the asset detail drawer (Summary / Documents / History) ── */
function AssetContext({ id, onAction }: { id: string; onAction?: (prompt: string) => void }) {
  const d = getAssetDetail(id);
  const cond = ASSET_CONDITION[id] ?? null;
  const [tab, setTab] = useState<DrawerTab>("summary");
  const [viewDoc, setViewDoc] = useState<ViewDoc | null>(null);

  // Reset to the summary tab whenever a different asset is pinned.
  useEffect(() => {
    setTab("summary");
    setViewDoc(null);
  }, [id]);

  if (!d) return null;

  const run = (prompt: string) => onAction?.(prompt);

  const belowHeader = (
    <>
      {/* Stats - persist across tabs, matching the drawer header */}
      <div className="px-6 py-4 border-y border-gray-100">
        <div className="flex flex-wrap gap-x-7 gap-y-3">
          {[
            { label: "Status", value: d.stats.status },
            { label: "Commissioned", value: d.stats.commissioned },
            { label: "Last service", value: d.stats.lastService },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-[11px] text-gray-500 tracking-wider">{s.label}</p>
              <p className="text-sm text-gray-800 mt-0.5">{s.value}</p>
            </div>
          ))}
          <div>
            <p className="text-[11px] text-gray-500 tracking-wider">Health</p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-chart-line rounded-full" style={{ width: `${d.stats.healthPct}%` }} />
              </div>
              <span className="text-xs text-gray-500">{d.stats.healthPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-6 mb-4 border-b border-gray-100">
        {DRAWER_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`py-3 mr-6 text-sm border-b-2 -mb-px transition-colors cursor-pointer ${
              tab === t.value ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <Shell title={d.code} subtitle={`${d.type} · ${d.location}`} kind="Asset" belowHeader={belowHeader}>
      {tab === "summary" && <DrawerBody d={d} cond={cond} nameplate={ASSET_NAMEPLATE[id]} assetId={id} onAction={run} />}
      {tab === "documents" && <DocumentsTab d={d} id={id} onOpen={setViewDoc} />}
      {tab === "history" && <ServiceHistoryTab id={id} />}

      <DocumentViewer
        doc={viewDoc}
        onClose={() => setViewDoc(null)}
        onAsk={(doc) => {
          setViewDoc(null);
          run(`Walk me through ${doc.title} (${doc.ref})`);
        }}
      />
    </Shell>
  );
}

/* ── Contract ────────────────────────────────────────────────────── */
function ContractContext({ id }: { id: string }) {
  const c = OPS_CONTRACTS.find((x) => x.id === id);
  const d = OPS_CONTRACT_DETAILS[id];
  if (!c) return null;
  return (
    <Shell title={c.name} subtitle={`${c.customer} · ${c.value}`} kind="Contract">
      <Card>
        <Stats
          items={[
            { label: "Status", value: <Badge label={c.status === "critical" ? "Critical" : "At risk"} urgent={c.status === "critical"} /> },
            { label: "Owner", value: c.owner },
            { label: "Progress", value: `${c.progress}%` },
            { label: "Value", value: c.value },
          ]}
        />
        <div className="flex flex-col gap-2">
          <div className="h-1 rounded-full overflow-hidden bg-[#222222]/20">
            <div className="h-full bg-[#222222]" style={{ width: `${c.progress}%` }} />
          </div>
          <p className="text-xs leading-4 text-gray-500">{c.progress}% of contract term ({c.start} → {c.end})</p>
        </div>
      </Card>

      {d && (
        <SummaryCard critical={c.status === "critical"}>
          <p className={`text-sm leading-5 ${c.status === "critical" ? "text-gray-800" : "text-gray-500"}`}>{d.summary}</p>
        </SummaryCard>
      )}

      <Card>
        <SectionTitle>Risk profile</SectionTitle>
        <RiskProfileView risk={c.risk} />
      </Card>

      {d && d.risks.length > 0 && (
        <Card>
          <SectionTitle>Open risks</SectionTitle>
          {d.risks.map((r, i) => (
            <div key={i} className="flex flex-col gap-4">
              {i > 0 && <hr className="border-gray-200" />}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm leading-5 font-bold text-gray-950">{r.title}</p>
                  <Badge label={r.level} urgent={r.level !== "Medium"} />
                </div>
                <p className="text-sm leading-5 text-gray-500">{r.detail}</p>
              </div>
            </div>
          ))}
        </Card>
      )}

      {d && d.milestones.length > 0 && (
        <Card>
          <SectionTitle>Milestones</SectionTitle>
          <div className="flex flex-col gap-3">
            {d.milestones.map((m) => (
              <div key={m.label} className="flex items-start gap-2">
                {m.done ? (
                  <span className="text-sm font-bold leading-[17px] text-green-500 shrink-0">✓</span>
                ) : (
                  <span className="size-2 mt-1.5 rounded-full border-[1.5px] border-gray-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <p className="text-sm leading-5 text-gray-950">{m.label}</p>
                  <div className="flex gap-3 text-xs leading-4 whitespace-nowrap">
                    <span className="text-gray-500">planned {m.planned}</span>
                    {m.actual && <span className="text-gray-950">actual {m.actual}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </Shell>
  );
}

/* ── Lead ────────────────────────────────────────────────────────── */
function OpportunityContext({ id }: { id: string }) {
  const opp = OPPORTUNITIES.find((x) => x.id === id);
  const d = OPPORTUNITY_DETAILS[id];
  if (!opp) return null;
  const idx = OPP_STAGES.indexOf(opp.stage);
  const readyCount = opp.requirements.filter((r) => r.done).length;
  return (
    <Shell title={opp.account} subtitle={opp.title} kind="Lead">
      <Card>
        <Stats
          items={[
            { label: "Value", value: opp.value },
            { label: "Owner", value: opp.owner },
            { label: "Stage", value: opp.stage },
            { label: "Status", value: opp.status === "on-track" ? "On track" : opp.status === "at-risk" ? "At risk" : "Stalled" },
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>Pipeline stage</SectionTitle>
        <div className="flex items-center gap-1.5">
          {OPP_STAGES.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= idx ? "bg-gray-900" : "bg-gray-200"}`} />
              <p className={`text-[10px] mt-1 text-center ${i === idx ? "text-gray-900" : "text-gray-500"}`}>{s}</p>
            </div>
          ))}
        </div>
      </Card>

      {d && (
        <SummaryCard critical={opp.status === "stalled"}>
          <p className={`text-sm leading-relaxed ${opp.status === "stalled" ? "text-gray-800" : "text-gray-500"}`}>{d.summary}</p>
          {d.recommendations.length > 0 && (
            <div>
              <p className="text-[11px] text-gray-500 tracking-wider mb-2">Recommended by HMAX</p>
              <div className="flex flex-col gap-2">
                {d.recommendations.map((r, i) => (
                  <div key={i} className="flex gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0 mt-1.5" />
                    <p className="text-sm text-gray-600 leading-snug">{r}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SummaryCard>
      )}

      <Card>
        <div className="flex items-center justify-between">
          <SectionTitle>Offer readiness</SectionTitle>
          <span className="text-xs text-gray-500">{readyCount} of {opp.requirements.length} complete</span>
        </div>
        <div className="flex flex-col">
          {opp.requirements.map((r) => (
            <div key={r.label} className="flex items-center gap-2.5 py-2 border-b border-gray-100 last:border-0">
              <span className={`text-sm ${r.done ? "text-gray-900" : "text-gray-500"}`}>{r.done ? "✓" : "○"}</span>
              <span className={`text-sm ${r.done ? "text-gray-700" : "text-gray-500"}`}>{r.label}</span>
              <span className="ml-auto flex items-center gap-2 shrink-0">
                <OwnerBadge owner={r.owner} />
                {!r.done && <span className="text-[10px] text-gray-500 border border-gray-200 rounded-full px-2 py-0.5">Missing</span>}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </Shell>
  );
}

/* ── Router ──────────────────────────────────────────────────────── */
export default function EntityContextPanel({ entity, onAction }: { entity: ContextEntity; onAction?: (prompt: string) => void }) {
  switch (entity.kind) {
    case "asset":
      return <AssetContext id={entity.id} onAction={onAction} />;
    case "contract":
      return <ContractContext id={entity.id} />;
    case "opportunity":
      return <OpportunityContext id={entity.id} />;
    case "customer":
      return <ContextPanel customer={entity.name} />;
  }
}
