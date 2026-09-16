"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  OPPORTUNITIES,
  PROPOSED_OPPORTUNITIES,
  ASSET_ALERTS,
  ASSET_DETAILS,
  leadDetail,
  leadMeta,
  type Opportunity,
  type OpportunityDetail,
  type OppCategory,
  type OppStatus,
  type ProposedOpportunity,
} from "@/lib/sales-data";
import { ACCOUNT_ATTENTION } from "@/lib/accounts-data";
import { type RiskProfile } from "@/lib/operations-data";
import AlertsWidget from "@/components/dashboard/alerts-widget";
import { Button } from "@/components/ui/button";
import { useConversationLauncher } from "@/components/dashboard/conversation-launcher";
import OpportunityDrawer from "./opportunity-drawer";
import { buildPlaybook } from "@/lib/alert-playbooks";
import type { AlertItem, AlertMetaItem, AlertUrgency } from "@/lib/alerts";

/* The type tabs are the pipeline stages. */
const STAGE_OPTIONS = ["Prospects", "Bidding", "Negotiation"];

/* A stalled lead is critical; at-risk maps straight across; on-track is a watch. */
const STATUS_URGENCY: Record<OppStatus, AlertUrgency> = {
  stalled: "critical",
  "at-risk": "at-risk",
  "on-track": "watch",
};

const REQ_LABELS: { label: string; owner: string }[] = [
  { label: "Account & shipping details", owner: "Sales ops - T. Wu" },
  { label: "Install Base profile", owner: "Reliability - F. Dubois" },
  { label: "Scope of Work & tech requirements", owner: "Engineering - J. Park" },
  { label: "Costing & pricing model", owner: "Commercial - A. Rossi" },
  { label: "Legal T&Cs", owner: "Legal - R. Bianchi" },
];

const RISK_LABEL: Record<string, string> = { high: "High", med: "Med", low: "Low" };
const RISK_AXES: (keyof RiskProfile)[] = ["schedule", "cost", "quality", "safety"];

/* A renewal is a bet on installed base you already service, so its card carries
   the account's open asset alerts, its fleet health, and the risk profile held
   on the account record. All derived - nothing authored per lead. */
function renewalContext(account: string): AlertMetaItem[] {
  const assets = ASSET_ALERTS.filter((a) => ASSET_DETAILS[a.id]?.related.customer === account);
  const risk = ACCOUNT_ATTENTION.find((a) => a.account === account)?.risk;
  const out: AlertMetaItem[] = [];

  if (assets.length > 0) {
    const critical = assets.filter((a) => a.status === "critical").length;
    const atRisk = assets.filter((a) => a.status === "at-risk").length;
    const parts = [
      critical > 0 ? `${critical} critical` : null,
      atRisk > 0 ? `${atRisk} at risk` : null,
    ].filter(Boolean);
    out.push({ label: "Assets", value: parts.length > 0 ? parts.join(" · ") : `${assets.length} monitored` });
    out.push({
      label: "Fleet health",
      value: `${Math.round(assets.reduce((s, a) => s + a.health, 0) / assets.length)}`,
    });
  }

  if (risk) {
    const notable = RISK_AXES.filter((k) => risk[k] !== "low").map(
      (k) => `${k[0].toUpperCase()}${k.slice(1)} ${RISK_LABEL[risk[k]]}`
    );
    out.push({ label: "Risk", value: notable.length > 0 ? notable.join(" · ") : "All low" });
  }

  return out;
}

// Turn a system proposal into a fresh pipeline lead.
function proposalToOpp(p: ProposedOpportunity): Opportunity {
  return {
    id: p.id,
    account: p.account,
    title: p.title,
    value: p.estimatedValue,
    owner: "Unassigned",
    stage: "Prospects",
    category: "New lead",
    status: "on-track",
    winConfidence: 20,
    rfqReceived: "Not received",
    bidDue: "TBC",
    expectedAward: "TBC",
    requirements: REQ_LABELS.map(({ label, owner }) => ({ label, owner, done: false })),
    recommendedAction: "Qualify budget & scope",
  };
}

function proposalDetail(p: ProposedOpportunity): OpportunityDetail {
  return {
    summary: p.rationale,
    recommendations: [
      "Add to your pipeline to begin qualification",
      "Confirm the budget and decision timeline with the account",
      "Map the assets in scope from the condition data",
    ],
    assets: [],
    related: { customer: p.account, contract: "New lead", region: "North America" },
  };
}

function toAlert(opp: Opportunity, withContext: boolean): AlertItem {
  const missing = opp.requirements.filter((r) => !r.done);
  const detail =
    missing.length > 0
      ? `${missing.length} input${missing.length > 1 ? "s" : ""} still needed before it can reach Offer: ${missing
          .map((m) => `${m.label} (${m.owner})`)
          .join("; ")}.`
      : "Every offer input is in place - this lead is ready to build the offer.";

  return {
    id: opp.id,
    customer: opp.account,
    type: opp.stage,
    urgency: STATUS_URGENCY[opp.status],
    title: opp.title,
    detail,
    meta: [...leadMeta(opp), ...(withContext ? renewalContext(opp.account) : [])],
    action: opp.recommendedAction,
    entity: { kind: "opportunity" as const, id: opp.id },
    playbook: buildPlaybook(
      opp.recommendedAction,
      missing.length > 0
        ? `${opp.account} - ${opp.title} (${opp.value} · ${opp.stage}). ${detail}`
        : `${opp.account} - ${opp.title} (${opp.value} · ${opp.stage}). Every offer input is in place - it's ready to send.`,
      { missing: missing.map((m) => ({ label: m.label, owner: m.owner })) }
    ),
    detailId: opp.id,
  };
}

/* A system proposal rendered in the same shape as every other alert, so it
   sits in its own "Proposed for you" band at the bottom of the list. */
function proposalToAlert(p: ProposedOpportunity): AlertItem {
  return {
    id: p.id,
    customer: p.account,
    type: "Proposed",
    urgency: "proposed",
    title: p.title,
    detail: p.rationale,
    meta: [
      { label: "Est. value", value: p.estimatedValue },
      { label: "Signals", value: p.signals.join(" · ") },
      { label: "Owner", value: "Unassigned" },
    ],
    action: `Qualify the ${p.account} ${p.title} proposal`,
    entity: { kind: "customer" as const, name: p.account },
    detailId: p.id,
  };
}

interface Props {
  /** Which side of the pipeline this widget covers. */
  category: OppCategory;
  title: string;
  /** Renewals carry the account's installed-base context on each card. */
  withContext?: boolean;
  /** System proposals and the build CTA belong on the new-business side. */
  withProposals?: boolean;
}

export default function Opportunities({ category, title, withContext = false, withProposals = false }: Props) {
  const [pipeline, setPipeline] = useState<Opportunity[]>(OPPORTUNITIES.filter((o) => o.category === category));
  const [proposed, setProposed] = useState<ProposedOpportunity[]>(withProposals ? PROPOSED_OPPORTUNITIES : []);
  const [drawer, setDrawer] = useState<{ opp: Opportunity; detail: OpportunityDetail } | null>(null);
  const launch = useConversationLauncher();

  const openDrawer = (opp: Opportunity) => setDrawer({ opp, detail: leadDetail(opp) });

  const addProposal = (p: ProposedOpportunity) => {
    setPipeline((pl) => [proposalToOpp(p), ...pl]);
    setProposed((pr) => pr.filter((x) => x.id !== p.id));
  };
  const reviewProposal = (p: ProposedOpportunity) => setDrawer({ opp: proposalToOpp(p), detail: proposalDetail(p) });
  const dismissProposal = (id: string) => setProposed((pr) => pr.filter((x) => x.id !== id));

  const alerts = [...pipeline.map((o) => toAlert(o, withContext)), ...proposed.map(proposalToAlert)];
  const oppFor = (id: string) => pipeline.find((o) => o.id === id);
  const proposalFor = (id: string) => proposed.find((p) => p.id === id);

  return (
    <AlertsWidget
      title={title}
      alerts={alerts}
      typeOptions={STAGE_OPTIONS}
      onOpenDetail={(a) => {
        // The eye opens the lead drawer - for a proposal, its review view.
        const p = proposalFor(a.detailId);
        if (p) return reviewProposal(p);
        const opp = oppFor(a.detailId);
        if (opp) openDrawer(opp);
      }}
      emptyLabel="No leads match the selected filters."
      onDismiss={(a) => dismissProposal(a.detailId)}
      extraActions={(a) => {
        const p = proposalFor(a.detailId);
        if (!p) return null;
        return (
          <Button
            variant="secondary"
            size="icon"
            onClick={() => addProposal(p)}
            aria-label={`Add ${p.title} to your pipeline`}
            title="Add to pipeline"
            className="rounded-full cursor-pointer"
          >
            <Plus size={16} strokeWidth={1.5} />
          </Button>
        );
      }}
      footer={
        withProposals ? (
          <button
            onClick={() => launch({ context: "New lead", prompt: "Build a new lead" })}
            className="flex items-center justify-center gap-2 border border-dashed border-gray-200 rounded-full py-4 text-sm font-bold text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Plus size={16} strokeWidth={1.5} />
            Build a new lead
          </button>
        ) : undefined
      }
    >
      <OpportunityDrawer opp={drawer?.opp ?? null} detail={drawer?.detail ?? null} onClose={() => setDrawer(null)} />
    </AlertsWidget>
  );
}
