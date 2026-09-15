"use client";

import { useState, useEffect } from "react";
import type { ContextEntity } from "@/components/dashboard/conversation-launcher";
import {
  ASSET_DETAILS,
  ASSET_CONDITION,
  OPPORTUNITIES,
  OPPORTUNITY_DETAILS,
  OPP_STAGES,
} from "@/lib/sales-data";
import { OPS_CONTRACTS, OPS_CONTRACT_DETAILS, type RiskProfile } from "@/lib/operations-data";
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
    <div className="w-[420px] h-full shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden">
      <div className="px-7 pt-10 pb-5 border-b border-gray-100">
        <span className="text-[11px] text-gray-400 tracking-wider">{kind}</span>
        <h1 className="text-2xl text-gray-900 leading-tight mt-1">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {belowHeader}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4 no-scrollbar">{children}</div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">{children}</div>;
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base text-gray-900 mb-4">{children}</h3>;
}
function Stats({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-7 gap-y-3">
      {items.map((s) => (
        <div key={s.label}>
          <p className="text-[11px] text-gray-400 tracking-wider">{s.label}</p>
          <p className="text-sm text-gray-800 mt-0.5">{s.value}</p>
        </div>
      ))}
    </div>
  );
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
const LEVEL_CLS: Record<string, string> = { Critical: "bg-gray-900 text-white", High: "bg-gray-700 text-white", Medium: "bg-gray-200 text-gray-700" };

/* ── Asset - mirrors the asset detail drawer (Summary / Documents / History) ── */
function AssetContext({ id, onAction }: { id: string; onAction?: (prompt: string) => void }) {
  const d = ASSET_DETAILS[id];
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
      <div className="px-7 py-4 border-b border-gray-100">
        <div className="flex flex-wrap gap-x-7 gap-y-3">
          {[
            { label: "Status", value: d.stats.status },
            { label: "Commissioned", value: d.stats.commissioned },
            { label: "Last service", value: d.stats.lastService },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-[11px] text-gray-400 tracking-wider">{s.label}</p>
              <p className="text-sm text-gray-800 mt-0.5">{s.value}</p>
            </div>
          ))}
          <div>
            <p className="text-[11px] text-gray-400 tracking-wider">Health</p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-900 rounded-full" style={{ width: `${d.stats.healthPct}%` }} />
              </div>
              <span className="text-xs text-gray-500">{d.stats.healthPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-7 border-b border-gray-100">
        {DRAWER_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`py-3 mr-6 text-sm border-b-2 -mb-px transition-colors cursor-pointer ${
              tab === t.value ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600"
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
            { label: "Status", value: c.status === "critical" ? "Critical" : "At risk" },
            { label: "Owner", value: c.owner },
            { label: "Progress", value: `${c.progress}%` },
            { label: "Value", value: c.value },
          ]}
        />
        <div className="mt-3">
          <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gray-900 rounded-full" style={{ width: `${c.progress}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">{c.progress}% of contract term ({c.start} → {c.end})</p>
        </div>
      </Card>

      {d && (
        <Card>
          <SectionTitle>Context summary</SectionTitle>
          <p className="text-sm text-gray-500 leading-relaxed">{d.summary}</p>
        </Card>
      )}

      <Card>
        <SectionTitle>Risk profile</SectionTitle>
        <RiskProfileView risk={c.risk} />
      </Card>

      {d && d.risks.length > 0 && (
        <Card>
          <SectionTitle>Open risks</SectionTitle>
          <div className="flex flex-col gap-4">
            {d.risks.map((r, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 mb-1">{r.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{r.detail}</p>
                </div>
                <span className={`text-[11px] px-3 py-0.5 rounded-full whitespace-nowrap ${LEVEL_CLS[r.level]}`}>{r.level}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {d && d.milestones.length > 0 && (
        <Card>
          <SectionTitle>Milestones</SectionTitle>
          <div className="flex flex-col gap-2">
            {d.milestones.map((m) => (
              <div key={m.label} className="flex items-start justify-between gap-3">
                <span className={`text-sm ${m.done ? "text-gray-700" : "text-gray-500"}`}>{m.done ? "✓ " : "○ "}{m.label}</span>
                <div className="flex gap-3 shrink-0 text-xs text-gray-400 whitespace-nowrap">
                  <span>planned {m.planned}</span>
                  {m.actual && <span className="text-gray-600">actual {m.actual}</span>}
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
              <p className={`text-[10px] mt-1 text-center ${i === idx ? "text-gray-900" : "text-gray-400"}`}>{s}</p>
            </div>
          ))}
        </div>
      </Card>

      {d && (
        <Card>
          <SectionTitle>Context summary</SectionTitle>
          <p className="text-sm text-gray-500 leading-relaxed">{d.summary}</p>
          {d.recommendations.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] text-gray-400 tracking-wider mb-2">Recommendations</p>
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
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base text-gray-900">Offer readiness</h3>
          <span className="text-xs text-gray-400">{readyCount} of {opp.requirements.length} complete</span>
        </div>
        <div className="flex flex-col">
          {opp.requirements.map((r) => (
            <div key={r.label} className="flex items-center gap-2.5 py-2 border-b border-gray-100 last:border-0">
              <span className={`text-sm ${r.done ? "text-gray-900" : "text-gray-300"}`}>{r.done ? "✓" : "○"}</span>
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
