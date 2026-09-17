/* ── What sits behind a KPI ───────────────────────────────────────────
   Clicking a KPI card lists the actual records that make up its number -
   the contracts, invoices, assets, reports or leads themselves - each one
   opening its own detail drawer. The lists are built from the same data the
   widgets below read, so the rows are the real things rather than a
   restatement of the headline. */

import { CONTRACT_BOOK, OPS_CONTRACTS, OPS_CONTRACT_DETAILS, TEAMS, contractValueM, formatM, type OpsContract } from "@/lib/operations-data";
import {
  ASSET_ALERTS,
  ASSET_CATEGORY_LABELS,
  OPPORTUNITIES,
  SLA_CONTRACTS,
  STAGE_PROB,
  dgaScore,
  lowDgaAssets,
  oppValue,
  type AssetAlert,
  type Opportunity,
} from "@/lib/sales-data";
import { ASSET_REVIEW_ALERTS } from "@/lib/reliability-data";
import { ASSET_REPORT_ALERTS, REPORTS_AWAITING } from "@/lib/field-reports-data";

export type KpiTone = "critical" | "warn" | "good";

/** Which detail drawer a row opens. */
export interface KpiLink {
  kind: "asset" | "ops" | "sla" | "lead";
  id: string;
}

export interface KpiRecord {
  id: string;
  /** The thing itself - a contract name, asset code, invoice, report. */
  title: string;
  /** Who or where it sits, on a second line. */
  meta?: string;
  /** The figure this row contributes, right-aligned. */
  value?: string;
  /** A short state word, coloured by tone. */
  status?: string;
  tone?: KpiTone;
  link?: KpiLink;
}

export interface KpiDetail {
  /** What the list is, above the rows. */
  caption: string;
  /** Column headings for the four fields of a record. */
  columns: { title: string; meta: string; value: string; status: string };
  records: KpiRecord[];
  /** One line on what is moving the number. */
  note?: string;
  /** The action HMAX recommends, and the conversation it opens. */
  action: { label: string; why: string; prompt: string };
}

/* ── Formatting ───────────────────────────────────────────────────── */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-08-10" -> "10 Aug" */
function day(iso: string): string {
  const [, m, d] = iso.split("-");
  return m && d ? `${Number(d)} ${MONTHS[Number(m) - 1]}` : iso;
}
const sales = (n: number) => `€${n.toFixed(1)}M`;

/* ── Contracts ────────────────────────────────────────────────────── */

const opsRow = (c: OpsContract): KpiRecord => ({
  id: c.id,
  title: c.name,
  meta: `${c.customer} · ${c.owner}`,
  value: c.value,
  status: c.status === "critical" ? "Critical" : "At risk",
  tone: c.status === "critical" ? "critical" : "warn",
  link: { kind: "ops", id: c.id },
});

const SLA_IDS = Object.keys(SLA_CONTRACTS);

const slaRow = (id: string): KpiRecord => {
  const d = SLA_CONTRACTS[id];
  return {
    id,
    title: `${d.account} service agreement`,
    meta: `Renews ${d.renewsIn} · ${d.owner}`,
    value: d.value,
    status: d.risk.verified ? undefined : d.risk.label,
    tone: d.risk.verified ? undefined : "warn",
    link: { kind: "sla", id },
  };
};

/** Every contract in the book: the delivery contracts and the service
 *  agreements behind them. */
const allContracts: KpiRecord[] = [...OPS_CONTRACTS.map(opsRow), ...SLA_IDS.map(slaRow)];
/** The ones carrying an open risk - all four delivery contracts, plus any
 *  agreement whose risk has not been verified. */
const contractsAtRisk: KpiRecord[] = [
  ...OPS_CONTRACTS.map(opsRow),
  ...SLA_IDS.filter((id) => !SLA_CONTRACTS[id].risk.verified).map(slaRow),
];

/* ── Invoices, milestones and maintenance, across both kinds ──────── */

interface Owned<T> {
  row: T;
  owner: string;
  link: KpiLink;
}

interface Invoice {
  code: string;
  milestone: string;
  amount: string;
  status: string;
  due: string;
}
interface Maint {
  task: string;
  due: string;
  interval: string;
  status: string;
}

/** The same nested list from every contract, each row tagged with the
 *  contract it came from so a row can open it. */
function acrossContracts<T>(pick: (d: { invoices: Invoice[]; maintenance: Maint[] }) => T[]): Owned<T>[] {
  const out: Owned<T>[] = [];
  for (const c of OPS_CONTRACTS) {
    const d = OPS_CONTRACT_DETAILS[c.id];
    if (d) for (const row of pick(d)) out.push({ row, owner: c.name, link: { kind: "ops", id: c.id } });
  }
  for (const id of SLA_IDS) {
    const d = SLA_CONTRACTS[id];
    for (const row of pick(d)) out.push({ row, owner: `${d.account} agreement`, link: { kind: "sla", id } });
  }
  return out;
}

const invoices = acrossContracts<Invoice>((d) => d.invoices ?? []);
const maintenance = acrossContracts<Maint>((d) => d.maintenance ?? []);

const invoiceRow = ({ row, owner, link }: Owned<Invoice>, tone?: KpiTone): KpiRecord => ({
  id: `${link.id}-${row.code}`,
  title: `${row.code} · ${row.milestone}`,
  meta: `${owner} · due ${day(row.due)}`,
  value: row.amount,
  status: row.status,
  tone,
  link,
});

/* Today, for ageing an invoice. The prototype's data is dated around it. */
const TODAY = new Date("2026-09-17");
const THIS_MONTH = "2026-09";
const daysOverdue = (due: string) => Math.round((TODAY.getTime() - new Date(due).getTime()) / 86_400_000);

const overdueInvoices = invoices
  .filter((i) => i.row.status === "Overdue")
  .sort((a, b) => daysOverdue(b.row.due) - daysOverdue(a.row.due));
/** The milestone invoices dated this month, whatever state they are in. */
const monthInvoices = invoices.filter((i) => i.row.due.startsWith(THIS_MONTH));

const sumM = (list: Owned<Invoice>[]) => list.reduce((sum, i) => sum + contractValueM(i.row.amount), 0);

/** What is owed and how stale it is - the Outstanding payments KPI reads this,
 *  so the headline and the list behind it are the same invoices. */
export const OUTSTANDING = {
  total: formatM(sumM(overdueInvoices)),
  count: overdueInvoices.length,
  note: `${overdueInvoices.length} ${overdueInvoices.length === 1 ? "invoice" : "invoices"} overdue`,
  over60: formatM(sumM(overdueInvoices.filter((i) => daysOverdue(i.row.due) > 60))),
};

/** Maintenance past its due date - the overdue inspections. */
export const overdueMaintenance = maintenance.filter((m) => m.row.status === "Overdue");

/** Milestones that landed late, or have yet to land at all. */
const openMilestones: KpiRecord[] = OPS_CONTRACTS.flatMap((c) => {
  const d = OPS_CONTRACT_DETAILS[c.id];
  return (d?.milestones ?? [])
    .filter((m) => !m.done || (m.actual && m.actual > m.planned))
    .map((m) => ({
      id: `${c.id}-${m.label}`,
      title: m.label,
      meta: c.name,
      value: m.actual ? `${day(m.actual)} vs ${day(m.planned)}` : `due ${day(m.planned)}`,
      status: m.done ? "Late" : "Outstanding",
      tone: (m.done ? "warn" : "critical") as KpiTone,
      link: { kind: "ops", id: c.id } as KpiLink,
    }));
});

/* ── Assets ───────────────────────────────────────────────────────── */

/** Where each asset sits, from whichever alert list mentions it. */
const LOCATIONS = new Map<string, string>(
  [...ASSET_ALERTS, ...ASSET_REVIEW_ALERTS, ...ASSET_REPORT_ALERTS].map((a) => [a.id, a.location])
);

const assetRow = (a: AssetAlert): KpiRecord => ({
  id: a.id,
  title: `${a.code} · ${ASSET_CATEGORY_LABELS[a.category] ?? a.category}`,
  meta: a.alert?.title ?? a.location,
  value: `${a.health}%`,
  status: a.status === "critical" ? "Critical" : "At risk",
  tone: a.status === "critical" ? "critical" : "warn",
  link: { kind: "asset", id: a.id },
});

const reviewCritical = ASSET_REVIEW_ALERTS.filter((a) => a.status === "critical");
const reviewAtRisk = ASSET_REVIEW_ALERTS.filter((a) => a.status === "at-risk");
const lowDga = lowDgaAssets();

/* ── Leads ────────────────────────────────────────────────────────── */

const leadRow = (o: Opportunity, weighted = false): KpiRecord => ({
  id: o.id,
  title: o.title,
  meta: `${o.account} · ${o.owner}`,
  value: weighted ? sales(oppValue(o.value) * STAGE_PROB[o.stage]) : o.value,
  status: weighted ? `${o.stage} · ${Math.round(STAGE_PROB[o.stage] * 100)}%` : o.stage,
  link: { kind: "lead", id: o.id },
});

const renewals = OPPORTUNITIES.filter((o) => o.category === "Renewal");
const offerPlus = OPPORTUNITIES.filter((o) => o.stage === "Bidding" || o.stage === "Negotiation");
const byValue = (a: Opportunity, b: Opportunity) => oppValue(b.value) - oppValue(a.value);
const byWeighted = (a: Opportunity, b: Opportunity) =>
  oppValue(b.value) * STAGE_PROB[b.stage] - oppValue(a.value) * STAGE_PROB[a.stage];

/** What is left of the book once the recognised revenue is taken out. */
const BACKLOG = formatM(contractValueM(CONTRACT_BOOK.total) - 18.4);

/* ── The registry ─────────────────────────────────────────────────── */

export const KPI_DETAIL: Record<string, KpiDetail> = {
  /* Project Manager */
  "active-contracts": {
    caption: "Delivery contracts and service agreements",
    columns: { title: "Contract", meta: "Customer and owner", value: "Value", status: "Status" },
    records: allContracts,
    note: "Two contracts moved out of on-track this month.",
    action: {
      label: "Summarise the moves",
      why: "Two contracts left on-track this month - worth knowing why before the next review.",
      prompt: "Which contracts moved out of on-track this month, and what caused it?",
    },
  },
  "contracts-at-risk": {
    caption: "Contracts carrying an open risk",
    columns: { title: "Contract", meta: "Customer and owner", value: "Value", status: "Status" },
    records: contractsAtRisk,
    note: "Both critical contracts are blocked on parts, not on labour.",
    action: {
      label: "Draft a recovery plan",
      why: "Sherco and North Sea are both critical and both waiting on the same supplier.",
      prompt: "Draft a recovery plan for the critical contracts",
    },
  },
  "revenue-mtd": {
    caption: "Milestone invoices dated this month",
    columns: { title: "Invoice", meta: "Contract and due date", value: "Amount", status: "Status" },
    records: monthInvoices.map((i) =>
      invoiceRow(i, i.row.status === "Draft" ? "warn" : i.row.status === "Overdue" ? "critical" : "good")
    ),
    note: "€2.1m of the €3.4m plan has landed. These are the invoices the rest of it depends on.",
    action: {
      label: "Find the invoicing gap",
      why: `${monthInvoices.filter((i) => i.row.status === "Draft").length} invoices dated this month are still in draft.`,
      prompt: "What is holding up the invoices still in draft this month?",
    },
  },
  "portfolio-value": {
    caption: "Contract value by agreement",
    columns: { title: "Contract", meta: "Customer and owner", value: "Value", status: "Status" },
    records: allContracts,
    note: `${CONTRACT_BOOK.atRisk} of the ${CONTRACT_BOOK.total} book sits on contracts flagged at risk.`,
    action: {
      label: "Check backlog cover",
      why: `${CONTRACT_BOOK.atRisk} of the book depends on contracts that are already slipping.`,
      prompt: `How is the ${BACKLOG} backlog covered, and what is at risk?`,
    },
  },

  /* Operations */
  "executed-margin": {
    caption: "Executed margin by contract",
    columns: { title: "Contract", meta: "As-sold and revenue", value: "Executed", status: "State" },
    records: OPS_CONTRACTS.flatMap((c) => {
      const f = OPS_CONTRACT_DETAILS[c.id]?.finance;
      if (!f) return [];
      const under = parseFloat(f.netMargin) < parseFloat(f.asSoldMargin);
      return [
        {
          id: c.id,
          title: c.name,
          meta: `As-sold ${f.asSoldMargin} · revenue ${f.revenue}`,
          value: f.netMargin,
          status: under ? "Under as-sold" : "On plan",
          tone: (under ? "warn" : "good") as KpiTone,
          link: { kind: "ops", id: c.id } as KpiLink,
        },
      ];
    }),
    note: "Change orders and expedited freight carry most of the erosion.",
    action: {
      label: "Trace the erosion",
      why: "0.8pp across the portfolio is roughly €0.4m of margin.",
      prompt: "Where is the 0.8pp of executed margin erosion coming from?",
    },
  },
  "revenue-vs-forecast": {
    caption: "Milestones late or still to land",
    columns: { title: "Milestone", meta: "Contract", value: "Dates", status: "State" },
    records: openMilestones,
    note: "Revenue only recognises when the milestone does.",
    action: {
      label: "Rebuild the forecast",
      why: "Two slipped milestones account for the whole €0.5m gap.",
      prompt: "Which milestones slipped, and what does that do to the forecast?",
    },
  },
  "outstanding-payments": {
    caption: "Invoices past their due date",
    columns: { title: "Invoice", meta: "Contract and due date", value: "Amount", status: "Status" },
    records: overdueInvoices.map((i) => invoiceRow(i, "critical")),
    note: "Each one is a milestone already delivered and signed off.",
    action: {
      label: "Chase the oldest invoices",
      why: `${OUTSTANDING.over60} has been outstanding for more than 60 days.`,
      prompt: "Draft a chase for the invoices overdue more than 60 days",
    },
  },
  "resource-coverage": {
    caption: "Utilisation by team",
    columns: { title: "Team", meta: "Allocation", value: "Utilisation", status: "Slack" },
    records: TEAMS.map((t) => ({
      id: t.name,
      title: t.name,
      meta: `${t.allocated} of ${t.headcount} allocated`,
      value: `${t.utilization}%`,
      status: t.utilization >= 95 ? "No slack" : t.utilization >= 85 ? "Tight" : "Has slack",
      tone: (t.utilization >= 95 ? "critical" : t.utilization >= 85 ? "warn" : "good") as KpiTone,
    })),
    note: "Field Service is the constraint, not headcount overall.",
    action: {
      label: "Cover the open roles",
      why: "Field Service is at 96% and two slipping deliveries depend on it.",
      prompt: "How do we cover the three open roles without putting on-time delivery at risk?",
    },
  },

  /* Sales */
  "pipeline-value": {
    caption: "Open leads by value",
    columns: { title: "Lead", meta: "Account and owner", value: "Value", status: "Stage" },
    records: [...OPPORTUNITIES].sort(byValue).map((o) => leadRow(o)),
    note: `${renewals.length} of the ${OPPORTUNITIES.length} leads renew a contract already in the book.`,
    action: {
      label: "Rank by winnability",
      why: "The pipeline grew this month, but most of the gain sits in early-stage prospects.",
      prompt: "Rank the open pipeline by how winnable each lead is",
    },
  },
  "weighted-forecast": {
    caption: "Each lead at its win probability",
    columns: { title: "Lead", meta: "Account and owner", value: "Weighted", status: "Stage" },
    records: [...OPPORTUNITIES].sort(byWeighted).map((o) => leadRow(o, true)),
    note: "Weighted at 20% for prospects, 60% at bid, 90% in negotiation.",
    action: {
      label: "Firm up negotiation",
      why: "The leads in negotiation carry the forecast - losing one moves it materially.",
      prompt: "What is still outstanding on the pipeline leads at negotiation?",
    },
  },
  "at-offer": {
    caption: "Leads at bid or in negotiation",
    columns: { title: "Lead", meta: "Account and owner", value: "Value", status: "Stage" },
    records: [...offerPlus].sort(byValue).map((o) => leadRow(o)),
    note: "Everything past bid has a customer deadline attached.",
    action: {
      label: "Check offer readiness",
      why: "An offer can't be built until scope and costing are finalised on each one.",
      prompt: "Which offers in the pipeline are not ready, and what is missing on each?",
    },
  },
  "active-leads": {
    caption: "Every open lead",
    columns: { title: "Lead", meta: "Account and owner", value: "Value", status: "Type" },
    records: OPPORTUNITIES.map((o) => ({ ...leadRow(o), status: o.category })),
    note: "Renewals convert faster - they already have service history behind them.",
    action: {
      label: "Start with the renewals",
      why: "Renewals carry the recurring-fault history that makes the technical case.",
      prompt: "Which renewals should I work first, and why?",
    },
  },

  /* Reliability Engineer */
  "critical-assets": {
    caption: "Assets blocking a review",
    columns: { title: "Asset", meta: "Finding", value: "Health", status: "Status" },
    records: reviewCritical.map(assetRow),
    note: "Each one is holding up a scope you are meant to sign off.",
    action: {
      label: "Review the blocking scopes",
      why: "Every critical asset is blocking a scope you are meant to sign off.",
      prompt: `Which scopes are blocked by ${reviewCritical.map((a) => a.code).join(" and ")}?`,
    },
  },
  "at-risk": {
    caption: "Assets scoring under 60",
    columns: { title: "Asset", meta: "Finding", value: "Health", status: "Status" },
    records: reviewAtRisk.map(assetRow),
    note: "Still serviceable, so an inspection now is cheaper than a failure later.",
    action: {
      label: "Plan the next inspections",
      why: "These are still serviceable, so an inspection now is cheaper than a failure later.",
      prompt: `What should the next inspection cover on ${reviewAtRisk.map((a) => a.code).join(" and ")}?`,
    },
  },
  "overdue-insp": {
    caption: "Maintenance past its due date",
    columns: { title: "Task", meta: "Contract and interval", value: "Due", status: "Status" },
    records: overdueMaintenance.map(({ row, owner, link }) => ({
      id: `${link.id}-${row.task}`,
      title: row.task,
      meta: `${owner} · ${row.interval}`,
      value: `due ${day(row.due)}`,
      status: "Overdue",
      tone: "critical" as KpiTone,
      link,
    })),
    note: "Two need site access coordinated before they can be scheduled at all.",
    action: {
      label: "Schedule the oldest two",
      why: "Two inspections are more than a month past due on assets already at risk.",
      prompt: "Schedule the two inspections that are more than a month overdue",
    },
  },

  /* Diagnostics */
  "reports-awaiting": {
    caption: "Reports awaiting your interpretation",
    columns: { title: "Report", meta: "Asset and category", value: "Score", status: "Status" },
    records: ASSET_REPORT_ALERTS.map((a) => {
      const score = dgaScore(a.id);
      return {
        ...assetRow(a),
        title: a.alert?.title ?? a.code,
        meta: `${a.code} · ${ASSET_CATEGORY_LABELS[a.category] ?? a.category}`,
        value: score === null ? `${a.health}%` : `DGA ${score}/100`,
      };
    }),
    note: `${ASSET_REPORT_ALERTS.filter((a) => a.status === "critical").length} of them are critical.`,
    action: {
      label: "Interpret the critical ones",
      why: "The critical reports are the ones another team is waiting on to act.",
      prompt: "Summarise the reports awaiting interpretation and how asset health is trending",
    },
  },
  "outstanding-reports": {
    caption: "Field reports in the queue",
    columns: { title: "Report", meta: "Engineer and submitted", value: "Waiting", status: "Priority" },
    records: REPORTS_AWAITING.map((r) => ({
      id: r.id,
      title: `${r.code} · ${r.type}`,
      meta: `${r.engineer} · submitted ${day(r.submitted)}`,
      value: `${r.waitingDays}d waiting`,
      status: r.priority === "critical" ? "Critical" : r.priority === "high" ? "High" : r.priority === "medium" ? "Medium" : "Low",
      tone: (r.priority === "critical" ? "critical" : r.priority === "high" ? "warn" : undefined) as KpiTone | undefined,
      link: { kind: "asset", id: r.assetId } as KpiLink,
    })),
    note: "Average turnaround is 14 days against a 10-day target.",
    action: {
      label: "Clear the queue",
      why: "Turnaround is four days over target, and the queue is where the time goes.",
      prompt: "Which assets are waiting on interpretation, and how is their health trending?",
    },
  },
  "low-dga": {
    caption: "Assets scoring under 60 on DGA",
    columns: { title: "Asset", meta: "Location", value: "DGA score", status: "Status" },
    records: lowDga.map((a) => ({
      id: a.assetId,
      title: a.assetId.toUpperCase(),
      meta: LOCATIONS.get(a.assetId) ?? "",
      value: `${a.score}/100`,
      status: a.score < 25 ? "Critical" : "At risk",
      tone: (a.score < 25 ? "critical" : "warn") as KpiTone,
      link: { kind: "asset", id: a.assetId } as KpiLink,
    })),
    note: "Acetylene is the gas pulling both scores down - arcing, not overheating.",
    action: {
      label: "Compare the gas trends",
      why: `AST-001 scores ${dgaScore("ast-001") ?? 0}/100 and is still trending down month on month.`,
      prompt: `Compare the DGA trend on ${lowDga.map((a) => a.assetId.toUpperCase()).join(" and ")}`,
    },
  },
};

export const kpiDetail = (id: string): KpiDetail | null => KPI_DETAIL[id] ?? null;
