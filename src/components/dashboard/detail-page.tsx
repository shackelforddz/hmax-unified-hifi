"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConversationLauncher } from "./conversation-launcher";
import { useDetailDrawers, type Detail } from "./detail-drawers";
import type { ContextEntity } from "./conversation-launcher";
import { ContractActions, ContractBody } from "./operations/contract-drawer";
import { SlaActions, SlaBody } from "./sales/sla-contract-drawer";
import { LeadActions, LeadBody } from "./sales/opportunity-drawer";
import {
  AssetActions,
  DrawerBody as AssetBody,
  DocumentsTab,
  ServiceHistoryTab,
} from "./sales/asset-drawer";
import DocumentViewer, { type ViewDoc } from "./sales/document-viewer";
import { OPS_CONTRACTS, OPS_CONTRACT_DETAILS } from "@/lib/operations-data";
import { ASSET_CONDITION, OPPORTUNITIES, SLA_CONTRACTS, leadDetail, leadMeta } from "@/lib/sales-data";
import { ASSET_NAMEPLATE } from "@/lib/asset-nameplate-data";
import { getAssetDetail, resolveAssetId } from "@/lib/asset-lookup";
import { AttentionActions, AttentionBody } from "./attention-drawer";
import { WorkOrderActions, WorkOrderBody } from "./work-order-drawer";
import { CustomerBody, customerRollup } from "./operations/customer-drawer";
import { ATTENTION_ITEMS, CUSTOMER_DETAILS } from "@/lib/dashboard-data";
import { WORK_ORDERS, WORK_ORDER_DETAILS } from "@/lib/work-orders-data";

/** The same record, as a conversation addresses it - so a chat started here
 *  opens with this record's detail content in its context pane. */
function entityFor(detail: Detail): ContextEntity | undefined {
  switch (detail.kind) {
    case "asset":
      return { kind: "asset", id: detail.id };
    case "ops":
    case "sla":
      return { kind: "contract", id: detail.id };
    case "lead":
      return { kind: "opportunity", id: detail.id };
    case "customer":
      return { kind: "customer", name: detail.id };
    case "attention": {
      const name = CUSTOMER_DETAILS[detail.id]?.name;
      return name ? { kind: "customer", name } : undefined;
    }
    case "work-order": {
      // A work order is read against the asset it is raised on.
      const asset = WORK_ORDERS.find((w) => w.id === detail.id)?.asset;
      const id = asset ? resolveAssetId(asset) : null;
      return id ? { kind: "asset", id } : undefined;
    }
  }
}

/** Which tab a record belongs under, so the page opens where it lives. */
export const TAB_FOR: Record<Detail["kind"], string> = {
  asset: "Assets",
  ops: "Contracts",
  sla: "Contracts",
  lead: "Leads",
  attention: "Customers",
  customer: "Customers",
  "work-order": "Assets",
};

/** The tab a page belongs under on this dashboard - its own if the dashboard
 *  has one, otherwise the first tab, which is where Back goes. */
export function pageTabFor(detail: Detail | null | undefined, tabs: string[]): string | null {
  if (!detail) return null;
  const t = TAB_FOR[detail.kind];
  return tabs.includes(t) ? t : tabs[0];
}

interface Fact {
  label: string;
  value: string;
}

/** What the page is: title, subtitle, the facts beside it, and its content. */
interface Page {
  title: string;
  subtitle: string;
  facts: Fact[];
  /** Context name for a conversation started from here. */
  context: string;
  body: React.ReactNode;
  actions: React.ReactNode;
  /** Tabs, for records that have more than one view. */
  tabs?: { label: string; value: string }[];
}

const ASSET_TABS = [
  { label: "Summary", value: "summary" },
  { label: "Documents", value: "documents" },
  { label: "Service history", value: "history" },
];

export default function DetailPage({ detail }: { detail: Detail }) {
  const drawers = useDetailDrawers();
  const launch = useConversationLauncher();
  const [tab, setTab] = useState("summary");
  const [viewDoc, setViewDoc] = useState<ViewDoc | null>(null);

  // A different record starts on its first tab again - adjusted during render
  // rather than in an effect, so it never paints the old tab first.
  const key = `${detail.kind}:${detail.id}`;
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    setTab("summary");
    setViewDoc(null);
  }

  const back = () => drawers?.closePage();
  const run = (context: string) => (prompt: string) => {
    back();
    launch({ context, prompt, entity: entityFor(detail) });
  };

  const page = build();
  if (!page) return null;

  function build(): Page | null {
    if (detail.kind === "ops") {
      const c = OPS_CONTRACTS.find((x) => x.id === detail.id);
      const d = OPS_CONTRACT_DETAILS[detail.id];
      if (!c || !d) return null;
      const onAction = run(c.customer);
      return {
        title: c.name,
        subtitle: `${c.customer} · ${c.value}`,
        context: c.customer,
        facts: [
          { label: "Status", value: c.status === "critical" ? "Critical" : "At risk" },
          { label: "Owner", value: c.owner },
          { label: "Progress", value: `${c.progress}%` },
          { label: "Value", value: c.value },
        ],
        body: <ContractBody c={c} d={d} onAction={onAction} />,
        actions: <ContractActions onAction={(label) => onAction(`${label} for ${c.name}`)} />,
      };
    }

    if (detail.kind === "sla") {
      const d = SLA_CONTRACTS[detail.id];
      if (!d) return null;
      const onAction = run(d.account);
      return {
        title: d.account,
        subtitle: d.agreement,
        context: d.account,
        facts: [
          { label: "Value", value: d.value },
          { label: "Term", value: d.term },
          { label: "Renews in", value: d.renewsIn },
          { label: "Owner", value: d.owner },
        ],
        body: <SlaBody d={d} onAction={onAction} />,
        actions: <SlaActions onAction={(label) => onAction(`${label} for ${d.account}`)} />,
      };
    }

    if (detail.kind === "lead") {
      const opp = OPPORTUNITIES.find((o) => o.id === detail.id);
      if (!opp) return null;
      const d = leadDetail(opp);
      const onAction = run(opp.account);
      return {
        title: opp.account,
        subtitle: opp.title,
        context: opp.account,
        facts: [
          { label: "Stage", value: opp.stage },
          {
            label: "Status",
            value: opp.status === "on-track" ? "On track" : opp.status === "at-risk" ? "At risk" : "Stalled",
          },
          // The rest of the bid cycle is a card in the body already.
          ...leadMeta(opp).slice(0, 3),
        ],
        body: <LeadBody opp={opp} detail={d} onAction={onAction} />,
        actions: <LeadActions onAction={(label) => onAction(`${label} for ${opp.account}`)} />,
      };
    }

    if (detail.kind === "attention") {
      const d = CUSTOMER_DETAILS[detail.id];
      if (!d) return null;
      const onAction = run(d.name);
      return {
        title: d.name,
        subtitle: d.subtitle,
        context: d.name,
        facts: [
          { label: "Owner", value: d.stats.owner },
          { label: "Value", value: d.stats.value },
          { label: "Margin", value: d.stats.margin },
          { label: "Schedule", value: d.stats.schedule },
        ],
        body: <AttentionBody d={d} critical={ATTENTION_ITEMS.find((a) => a.id === detail.id)?.status === "critical"} onAction={onAction} />,
        actions: <AttentionActions />,
      };
    }

    if (detail.kind === "work-order") {
      const w = WORK_ORDERS.find((x) => x.id === detail.id);
      const d = WORK_ORDER_DETAILS[detail.id];
      if (!w || !d) return null;
      const onAction = run(w.code);
      return {
        title: w.code,
        subtitle: w.title,
        context: w.code,
        facts: [
          { label: "Type", value: w.type },
          { label: "Assignee", value: w.assignee },
          { label: "Asset", value: w.asset },
          { label: "Due", value: w.due },
        ],
        body: <WorkOrderBody w={w} d={d} onAction={onAction} />,
        actions: <WorkOrderActions onAction={(label) => onAction(`${label} for ${w.code}`)} />,
      };
    }

    if (detail.kind === "customer") {
      const onAction = run(detail.id);
      const roll = customerRollup(detail.id);
      if (!roll) return null;
      return {
        title: detail.id,
        subtitle: roll.subtitle,
        context: detail.id,
        facts: roll.facts,
        body: <CustomerBody customer={detail.id} onAction={onAction} />,
        actions: null,
      };
    }

    const d = getAssetDetail(detail.id);
    if (!d) return null;
    const onAction = run(d.code);
    return {
      title: d.code,
      subtitle: `${d.type} · ${d.location}`,
      context: d.code,
      facts: [
        { label: "Status", value: d.stats.status },
        { label: "Commissioned", value: d.stats.commissioned },
        { label: "Last service", value: d.stats.lastService },
        { label: "Health", value: `${d.stats.healthPct}%` },
      ],
      tabs: ASSET_TABS,
      body:
        tab === "documents" ? (
          <DocumentsTab d={d} id={detail.id} onOpen={setViewDoc} />
        ) : tab === "history" ? (
          <ServiceHistoryTab id={detail.id} />
        ) : (
          <AssetBody
            d={d}
            cond={ASSET_CONDITION[detail.id] ?? null}
            nameplate={ASSET_NAMEPLATE[detail.id]}
            assetId={detail.id}
            onAction={onAction}
          />
        ),
      actions: <AssetActions onAction={(label) => onAction(`${label} for ${d.code}`)} />,
    };
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={back}
        className="self-start flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <ArrowLeft size={15} strokeWidth={1.5} />
        Back
      </button>

      <div>
        {/* Header */}
        <div className="">
          <h2 className="text-2xl text-gray-900">{page.title}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{page.subtitle}</p>
        </div>

        {page.tabs && (
          <div className="flex px-6 border-b border-gray-100">
            {page.tabs.map((t) => (
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
        )}

        {/* The record, with what it is and what to do with it beside it */}
        <div className="flex flex-col lg:flex-row gap-6 py-6">
          <div className="min-w-0 flex-1 max-w-[820px]">{page.body}</div>

          <aside className="lg:w-[260px] shrink-0 lg:self-start lg:sticky lg:top-4 flex flex-col gap-5 lg:border-l lg:border-gray-100 lg:pl-6">
            <div className="flex flex-col gap-3">
              {page.facts.map((f) => (
                <div key={f.label}>
                  <p className="text-[11px] text-gray-500 tracking-wider">{f.label}</p>
                  <p className="text-sm text-gray-800 mt-0.5">{f.value}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => run(page.context)(`Tell me about ${page.title}`)}
                className="rounded-full h-auto py-2.5 text-sm text-gray-700 cursor-pointer"
              >
                Ask HMAX
              </Button>
              {page.actions}
            </div>
          </aside>
        </div>
      </div>

      <DocumentViewer
        doc={viewDoc}
        onClose={() => setViewDoc(null)}
        onAsk={(doc) => {
          setViewDoc(null);
          run(page.context)(`Walk me through ${doc.title} (${doc.ref})`);
        }}
      />
    </div>
  );
}
