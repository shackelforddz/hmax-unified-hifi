"use client";

import { useState } from "react";
import type { ContextEntity } from "@/components/dashboard/conversation-launcher";
import {
  ASSET_CONDITION,
  OPPORTUNITIES,
  SLA_CONTRACTS,
  leadDetail,
  leadMeta,
} from "@/lib/sales-data";
import { OPS_CONTRACTS, OPS_CONTRACT_DETAILS } from "@/lib/operations-data";
import { getAssetDetail } from "@/lib/asset-lookup";
import { ASSET_NAMEPLATE } from "@/lib/asset-nameplate-data";
import {
  DrawerBody as AssetBody,
  DocumentsTab,
  ServiceHistoryTab,
  DRAWER_TABS,
  type DrawerTab,
} from "@/components/dashboard/sales/asset-drawer";
import { ContractBody } from "@/components/dashboard/operations/contract-drawer";
import { SlaBody } from "@/components/dashboard/sales/sla-contract-drawer";
import { LeadBody } from "@/components/dashboard/sales/opportunity-drawer";
import { CustomerBody, customerRollup } from "@/components/dashboard/operations/customer-drawer";
import DocumentViewer, { type ViewDoc } from "@/components/dashboard/sales/document-viewer";

/* ── The conversation's left context pane ────────────────────────────
   Whatever record the conversation is about, the pane shows that record's
   own detail content - the same body the drawer and the full page render, so
   there is only one version of a contract, lead, asset or customer to keep
   right. The pane only differs in chrome: a narrower shell and no actions. */

interface Fact {
  label: string;
  value: string;
}

function Shell({
  title,
  subtitle,
  kind,
  facts,
  belowHeader,
  children,
}: {
  title: string;
  subtitle?: string;
  kind: string;
  facts?: Fact[];
  belowHeader?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-full shrink-0 bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden">
      <div className="px-6 pt-6 pb-4 flex flex-col gap-1">
        <span className="text-sm leading-none text-gray-500">{kind}</span>
        <h1 className="text-[28px] leading-[34px] text-gray-950">{title}</h1>
        {subtitle && <p className="text-sm leading-5 text-gray-500">{subtitle}</p>}
      </div>
      {facts && facts.length > 0 && <Facts items={facts} />}
      {belowHeader}
      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 flex flex-col gap-4 no-scrollbar">{children}</div>
    </div>
  );
}

/** The record's headline facts, as the detail page lists them. */
function Facts({ items }: { items: Fact[] }) {
  return (
    <div className="px-6 py-4 border-y border-gray-100">
      <div className="flex flex-wrap gap-x-7 gap-y-3">
        {items.map((f) => (
          <div key={f.label}>
            <p className="text-[11px] text-gray-500 tracking-wider">{f.label}</p>
            <p className="text-sm text-gray-800 mt-0.5">{f.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Asset - summary / documents / service history, as the drawer has ── */
function AssetContext({ id, onAction }: { id: string; onAction: (prompt: string) => void }) {
  const d = getAssetDetail(id);
  const [tab, setTab] = useState<DrawerTab>("summary");
  const [viewDoc, setViewDoc] = useState<ViewDoc | null>(null);

  // A different asset starts on the summary tab again - adjusted during
  // render rather than in an effect, so the old tab is never painted first.
  const [lastId, setLastId] = useState(id);
  if (id !== lastId) {
    setLastId(id);
    setTab("summary");
    setViewDoc(null);
  }

  if (!d) return null;

  const tabs = (
    <div className="flex px-6 border-b border-gray-100">
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
  );

  return (
    <Shell
      title={d.code}
      subtitle={`${d.type} · ${d.location}`}
      kind="Asset"
      facts={[
        { label: "Status", value: d.stats.status },
        { label: "Commissioned", value: d.stats.commissioned },
        { label: "Last service", value: d.stats.lastService },
        { label: "Health", value: `${d.stats.healthPct}%` },
      ]}
      belowHeader={tabs}
    >
      {tab === "summary" && (
        <AssetBody
          d={d}
          cond={ASSET_CONDITION[id] ?? null}
          nameplate={ASSET_NAMEPLATE[id]}
          assetId={id}
          onAction={onAction}
        />
      )}
      {tab === "documents" && <DocumentsTab d={d} id={id} onOpen={setViewDoc} />}
      {tab === "history" && <ServiceHistoryTab id={id} />}

      <DocumentViewer
        doc={viewDoc}
        onClose={() => setViewDoc(null)}
        onAsk={(doc) => {
          setViewDoc(null);
          onAction(`Walk me through ${doc.title} (${doc.ref})`);
        }}
      />
    </Shell>
  );
}

/* ── Contract - a delivery contract, or an SLA agreement ─────────── */
function ContractContext({ id, onAction }: { id: string; onAction: (prompt: string) => void }) {
  const c = OPS_CONTRACTS.find((x) => x.id === id);
  const d = OPS_CONTRACT_DETAILS[id];
  if (c && d) {
    return (
      <Shell
        title={c.name}
        subtitle={`${c.customer} · ${c.value}`}
        kind="Contract"
        facts={[
          { label: "Status", value: c.status === "critical" ? "Critical" : "At risk" },
          { label: "Owner", value: c.owner },
          { label: "Progress", value: `${c.progress}%` },
          { label: "Value", value: c.value },
        ]}
      >
        <ContractBody c={c} d={d} onAction={onAction} />
      </Shell>
    );
  }

  const sla = SLA_CONTRACTS[id];
  if (!sla) return null;
  return <SlaContext d={sla} onAction={onAction} />;
}

function SlaContext({ d, onAction }: { d: (typeof SLA_CONTRACTS)[string]; onAction: (prompt: string) => void }) {
  return (
    <Shell
      title={d.account}
      subtitle={d.agreement}
      kind="Service agreement"
      facts={[
        { label: "Value", value: d.value },
        { label: "Term", value: d.term },
        { label: "Renews in", value: d.renewsIn },
        { label: "Owner", value: d.owner },
      ]}
    >
      <SlaBody d={d} onAction={onAction} />
    </Shell>
  );
}

/* ── Lead ────────────────────────────────────────────────────────── */
function OpportunityContext({ id, onAction }: { id: string; onAction: (prompt: string) => void }) {
  const opp = OPPORTUNITIES.find((x) => x.id === id);
  if (!opp) return null;
  return (
    <Shell
      title={opp.account}
      subtitle={opp.title}
      kind="Lead"
      facts={[
        { label: "Stage", value: opp.stage },
        {
          label: "Status",
          value: opp.status === "on-track" ? "On track" : opp.status === "at-risk" ? "At risk" : "Stalled",
        },
        // The rest of the bid cycle is a card in the body already.
        ...leadMeta(opp).slice(0, 3),
      ]}
    >
      <LeadBody opp={opp} detail={leadDetail(opp)} onAction={onAction} />
    </Shell>
  );
}

/* ── Customer - the estate roll-up, or the SLA if that's all there is ── */
function CustomerContext({ name, onAction }: { name: string; onAction: (prompt: string) => void }) {
  const roll = customerRollup(name);
  if (roll) {
    return (
      <Shell title={name} subtitle={roll.subtitle} kind="Customer" facts={roll.facts}>
        <CustomerBody customer={name} onAction={onAction} />
      </Shell>
    );
  }

  // No delivery contracts - the account is in the pipeline as an SLA renewal.
  const sla = Object.values(SLA_CONTRACTS).find((s) => s.account === name);
  if (!sla) return null;
  return <SlaContext d={sla} onAction={onAction} />;
}

/* ── Router ──────────────────────────────────────────────────────── */
export default function EntityContextPanel({
  entity,
  onAction,
}: {
  entity: ContextEntity;
  onAction?: (prompt: string) => void;
}) {
  const run = (prompt: string) => onAction?.(prompt);
  switch (entity.kind) {
    case "asset":
      return <AssetContext id={entity.id} onAction={run} />;
    case "contract":
      return <ContractContext id={entity.id} onAction={run} />;
    case "opportunity":
      return <OpportunityContext id={entity.id} onAction={run} />;
    case "customer":
      return <CustomerContext name={entity.name} onAction={run} />;
  }
}
