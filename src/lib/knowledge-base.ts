import { CONTRACT_COUNTS, OPS_CONTRACTS } from "@/lib/operations-data";
import { PEOPLE } from "@/lib/people-data";
import { REPORTS_AWAITING, REPORT_TURNAROUND, ASSET_REPORT_ALERTS } from "@/lib/field-reports-data";
import { ASSET_REVIEW_ALERTS, SITE_CONSTRAINTS } from "@/lib/reliability-data";
import { OPPORTUNITIES } from "@/lib/sales-data";

/* ── Knowledge base ──────────────────────────────────────────────────
   Dummy portfolio data + a lightweight query engine so the assistant can
   return grounded answers to free-text prompts (contracts, assets, KPIs). */

import type { CustomWidgetConfig, WidgetType } from "@/lib/custom-widget";

export interface KBContract {
  customer: string;
  value: string;
  margin: string;
  status: string;
  owner: string;
  region: string;
  due: string;
  note: string;
}

export interface KBAsset {
  code: string;
  type: string;
  location: string;
  health: string;
  status: string;
  commissioned: string;
  note: string;
}

export const CONTRACTS: KBContract[] = [
  { customer: "Xcel Energy", value: "€4.2M", margin: "14.2%", status: "Delivery at risk", owner: "Daniel Brooks", region: "North America", due: "8 Sep 2026", note: "HVDC winding replacement on S-12/S-14. 18 days late; €1.2M invoice blocked on site commissioning. Delta Coils is the critical dependency." },
  { customer: "Siemens", value: "€2.4M", margin: "11.8%", status: "Invoice blocked", owner: "Sarah Mitchell", region: "North Sea", due: "15 Sep 2026", note: "Switchgear refurbishment. Change order CO-118 unsigned, holding a €680k progress invoice and dragging margin 14pts under baseline." },
  { customer: "Baltic Wind NL", value: "€2.4M", margin: "19.4%", status: "Healthy", owner: "Sarah Mitchell", region: "North Sea", due: "20 Sep 2026", note: "Offshore transformer maintenance. On track, but two HSE certificates expire before the next visit and a verbal inspection extension is undocumented." },
  { customer: "Pacific Gas", value: "€440k", margin: "21.0%", status: "Healthy", owner: "Lena Fischer", region: "North Sea", due: "25 Sep 2026", note: "Protection relay upgrade. On schedule; site access is verbal-only and needs a written agreement before mobilisation." },
  { customer: "ComEd", value: "€4.8M", margin: "12.6%", status: "Issues open", owner: "Marcus Lee", region: "North America", due: "in 22 days", note: "SLA renewal with open service issues; flagged High risk in the pipeline." },
  { customer: "NV Energy", value: "€2.1M", margin: "17.9%", status: "Verified", owner: "Marcus Lee", region: "North America", due: "in 31 days", note: "SLA renewal, service health verified and low risk." },
  { customer: "AEP Ohio", value: "€6.2M", margin: "13.1%", status: "Asset declining", owner: "Priya N.", region: "North America", due: "in 38 days", note: "Largest renewal in the pipeline; asset health declining, flagged High risk." },
  { customer: "Duke Energy", value: "€5.4M", margin: "15.5%", status: "Watch", owner: "Priya N.", region: "North America", due: "in 58 days", note: "SLA renewal on watch, medium risk." },
];

export const ASSETS: KBAsset[] = [
  { code: "AST-001", type: "Power transformer", location: "Zone A · Pump Station 1", health: "24%", status: "Critical", commissioned: "2009", note: "Potential overheating - degraded transformer performance across substations indicates insulation wear needing immediate diagnostic review." },
  { code: "AST-002", type: "Power transformer", location: "Zone A · Pump Station 1", health: "24%", status: "Critical", commissioned: "2011", note: "Repeated-repair asset - seal replacement (Jan 2026), bearing inspection (Nov 2025), motor vibration check (Aug 2025)." },
  { code: "AST-003", type: "Power transformer", location: "Zone A · Pump Station 1", health: "24%", status: "At Risk", commissioned: "2013", note: "Score below 60; scheduled for condition assessment." },
  { code: "AST-004", type: "Power transformer", location: "Zone A · Pump Station 1", health: "24%", status: "At Risk", commissioned: "2014", note: "Score below 60; monitoring for further decline." },
  { code: "S-09", type: "HVDC Converter Transformer", location: "Sherco Converter Station, MN", health: "88 (Healthy)", status: "Healthy", commissioned: "2010", note: "DGA normal, specs complete." },
  { code: "S-11", type: "HVDC Converter Transformer", location: "Sherco Converter Station, MN", health: "74 (Watch)", status: "Watch", commissioned: "2016", note: "Partial discharge elevated; DGA hydrogen trending above threshold three months running." },
  { code: "S-12", type: "HVDC Converter Transformer", location: "Sherco Converter Station, MN · Asset ID 41", health: "Unknown", status: "Watch", commissioned: "1988", note: "Recurring partial discharge - 3rd occurrence (Nov 2025, Mar 2026, Aug 2026). >35 years old; inspection needed. Both the reason to buy and to push back on price with Xcel." },
  { code: "S-14", type: "HVDC Converter Transformer", location: "Sherco Converter Station, MN · Asset ID 54", health: "Unknown", status: "Watch", commissioned: "1991", note: "Nameplate docs on paper at Denver; not yet digitised." },
];

export const PORTFOLIO = {
  // Counted from the contracts themselves, so the assistant and the dashboard
  // never quote different numbers.
  activeContracts: CONTRACT_COUNTS.active,
  contractsAtRisk: CONTRACT_COUNTS.atRisk + CONTRACT_COUNTS.critical,
  portfolioMargin: "18.6%",
  onTimeDelivery: "60%",
  fleetHealthToday: 71,
  fleetHealth30d: 83,
  criticalAssets: 2,
  atRiskAssets: 3,
  revenueAtRisk: "€7.1M",
  upcomingRenewals: 12,
};

const VENDORS = [
  { name: "Delta Coils Inc.", amount: "€4.8M", projects: 6 },
  { name: "Nexans", amount: "€1.4M", projects: 3 },
  { name: "Nynas AB", amount: "€0.6M", projects: 2 },
  { name: "Air Liquide", amount: "€0.3M", projects: 1 },
];

const MILESTONES = [
  "Xcel Energy - Field mobilization · 2 days late",
  "Pacific Gas - Site access agreement · in 3 days",
  "Siemens - Change order sign-off · in 5 days",
  "Xcel Energy - Site commissioning · in 8 days",
  "Baltic Wind NL - HSE cert renewal · in 10 days",
];

/* ── Query engine ────────────────────────────────────────────────── */

function normalizeAssetCode(raw: string): string {
  const m = raw.toLowerCase().replace(/\s/g, "").match(/^([a-z]+)-?0*(\d+)$/);
  if (!m) return raw.toUpperCase();
  const prefix = m[1].toUpperCase();
  const num = m[2];
  return prefix === "AST" ? `AST-${num.padStart(3, "0")}` : `${prefix}-${num}`;
}

const CONTRACT_NEXT: Record<string, string> = {
  "Delivery at risk": "Escalate the schedule and protect the delivery window - this is the portfolio's largest single risk.",
  "Invoice blocked": "Clear the blocker (sign the change order / raise the PO) to release the held invoice.",
  "Asset declining": "Commission a condition assessment before the renewal so service health is defensible.",
  "Issues open": "Close the open service issues ahead of the renewal date.",
  Watch: "Keep monitoring - no action needed yet, but review before the renewal window.",
  Healthy: "On track - protect it by closing the one open item noted above.",
  Verified: "Fully verified - no action needed.",
};

function formatContract(c: KBContract): string {
  return [
    `${c.customer} - ${c.status}`,
    `Value ${c.value} · Margin ${c.margin} · Owner ${c.owner} · ${c.region}`,
    `Due ${c.due}.`,
    ``,
    c.note,
    ``,
    `Recommended by HMAX: ${CONTRACT_NEXT[c.status] ?? "Review with the account owner."}`,
  ].join("\n");
}

function formatAsset(a: KBAsset): string {
  const rec =
    a.status === "Critical"
      ? "Run a diagnostic now - health this low usually means insulation wear that won't self-correct."
      : a.status === "Watch"
      ? "Schedule an inspection and capture the missing nameplate/DGA data before the next window."
      : "No action needed - keep it on the standard monitoring cycle.";
  return [
    `${a.code} - ${a.type}`,
    `${a.location}`,
    `Health ${a.health} · ${a.status} · Commissioned ${a.commissioned}`,
    ``,
    a.note,
    ``,
    `Recommended by HMAX: ${rec}`,
  ].join("\n");
}

function vendorAnswer(): string {
  const total = VENDORS.reduce((s, v) => s + parseFloat(v.amount.replace(/[^0-9.]/g, "")), 0);
  const lines = VENDORS.map((v) => `• ${v.name} - ${v.amount} across ${v.projects} project${v.projects > 1 ? "s" : ""}`);
  return [
    `Vendor concentration - ${PORTFOLIO.revenueAtRisk} of delivery-linked revenue rides on four suppliers:`,
    ...lines,
    ``,
    `Delta Coils Inc. alone carries €4.8M across 6 projects - 68% of the exposure. That's a concentration problem, not six independent delays: one vendor slip cascades across the portfolio, and it's already the reason Xcel is 18 days late.`,
    `Recommended by HMAX: lock a secondary source for winding sets before the next PO cycle, and put Delta Coils on a weekly delivery check-in. A single qualified backup would cut the concentration from ${((4.8 / total) * 100).toFixed(0)}% to under 40%.`,
  ].join("\n");
}

function slaAnswer(): string {
  const open = CONTRACTS.filter((c) => ["Issues open", "Asset declining", "Watch"].includes(c.status));
  const pipeline = CONTRACTS.filter((c) => c.due.startsWith("in "));
  const totalValue = pipeline.reduce((s, c) => s + parseFloat(c.value.replace(/[^0-9.]/g, "")), 0);
  return [
    `SLA Pipeline - ${PORTFOLIO.upcomingRenewals} renewals upcoming, ~€${totalValue.toFixed(1)}M of contract value in the next 60 days:`,
    ...pipeline.map((c) => `• ${c.customer} - ${c.value} · due ${c.due} · ${c.status}`),
    ``,
    `${open.length} of these need attention before they renew. AEP Ohio (€6.2M) is the largest and its asset health is declining; ComEd (€4.8M) has open service issues and is due first, in 22 days.`,
    `Recommended by HMAX: sequence the renewal work by due date and risk - start AEP Ohio and ComEd this week so service health is defensible at the negotiation.`,
  ].join("\n");
}

function deliveryAnswer(): string {
  return [
    `On-time delivery is ${PORTFOLIO.onTimeDelivery} - down 5pp on last month and 25pp under the 85% target, the fourth consecutive monthly decline (78 → 74 → 70 → 68 → 64 → 60).`,
    ``,
    `The single biggest drag is Xcel Energy: 18 days late, pushing the work out of the autumn outage window into February. Every week of slip moves ~€0.3M of invoicing into the next quarter, and 60% is the exact number Xcel will quote back during the SLA renewal.`,
    `Recommended by HMAX: escalate the Xcel schedule now and protect the outage window - recovering that one project lifts portfolio on-time delivery ~6pp on its own.`,
  ].join("\n");
}

function marginAnswer(): string {
  const worst = [...CONTRACTS].sort((a, b) => parseFloat(a.margin) - parseFloat(b.margin)).slice(0, 3);
  return [
    `Portfolio margin is ${PORTFOLIO.portfolioMargin}, 0.8pp under plan and trending down for three straight months.`,
    `Lowest-margin contracts:`,
    ...worst.map((c) => `• ${c.customer} - ${c.margin} (${c.status})`),
    ``,
    `Siemens is the biggest distortion: reported margin sits ~14pts under baseline purely because change order CO-118 is unbooked. It's an accounting artefact, not a real loss - booking the CO recovers most of the gap.`,
    `Recommended by HMAX: book CO-118 to release the €680k invoice and restore Siemens margin; that alone lifts the portfolio ~0.5pp back toward plan.`,
  ].join("\n");
}

function revenueAnswer(): string {
  return [
    `${PORTFOLIO.revenueAtRisk} of revenue is at risk this quarter, concentrated in four triggers:`,
    `• Delivery slip - €4.8M (Delta Coils vendor concentration)`,
    `• Invoice blocked - €1.2M (Xcel, milestone 4 / site commissioning not achieved)`,
    `• Change order unsigned - €0.7M (Siemens CO-118)`,
    `• Scope creep - €0.4M`,
    ``,
    `Two of these are one action away from clearing: raising the gasket-set PO unblocks the Xcel path, and signing CO-118 releases the Siemens invoice - together ~€1.9M recoverable this quarter.`,
    `Recommended by HMAX: raise the transformer gasket-set PO today - it's the longest lead item (35 days) and the largest single blocker.`,
  ].join("\n");
}

function fleetAnswer(): string {
  return [
    `Fleet health is ${PORTFOLIO.fleetHealthToday} today, down from ${PORTFOLIO.fleetHealth30d} thirty days ago (−12) - the sharpest drop in six months.`,
    `${PORTFOLIO.criticalAssets} critical assets and ${PORTFOLIO.atRiskAssets} scoring under 60:`,
    `• AST-001 & AST-002 - 24% health, Critical, Zone A · Pump Station 1 (overheating / repeat repairs)`,
    `• AST-003 & AST-004 - At Risk, scores below 60`,
    ``,
    `The decline is driven by the Zone A transformer cluster; AST-002 is a repeat-repair asset (three interventions in six months), which usually signals an end-of-life pattern rather than isolated faults.`,
    `Recommended by HMAX: prioritise a diagnostic on AST-001 and AST-002 this cycle and open a condition assessment on the At-Risk pair before scores drop further.`,
  ].join("\n");
}

function milestoneAnswer(): string {
  return [
    `Upcoming milestones (next 14 days) - one already overdue:`,
    ...MILESTONES.map((m) => `• ${m}`),
    ``,
    `Xcel's field mobilization is 2 days late and blocks everything downstream; Pacific Gas site access (in 3 days) is still verbal-only and needs a written agreement before the crew can mobilise.`,
    `Recommended by HMAX: clear the Xcel mobilization and confirm Pacific Gas access in writing first - the other three are on track.`,
  ].join("\n");
}

function riskAnswer(): string {
  const risky = CONTRACTS.filter((c) => ["Delivery at risk", "Invoice blocked", "Asset declining", "Issues open"].includes(c.status));
  return [
    `${PORTFOLIO.contractsAtRisk} of ${PORTFOLIO.activeContracts} contracts are flagged at risk. Highest-priority right now:`,
    ...risky.map((c) => `• ${c.customer} - ${c.status} · ${c.value} (${c.owner})`),
    ``,
    `Xcel (delivery) and Siemens (invoice) carry the most exposure and both have a clear unblock. ${PORTFOLIO.revenueAtRisk} of revenue sits behind these flags this quarter.`,
    `Recommended by HMAX: work Xcel and Siemens first - each is a single decision away from moving out of the risk column.`,
  ].join("\n");
}

function portfolioAnswer(): string {
  return [
    `Portfolio snapshot`,
    `• ${PORTFOLIO.activeContracts} active contracts · ${PORTFOLIO.contractsAtRisk} at risk`,
    `• Margin ${PORTFOLIO.portfolioMargin} (0.8pp under plan) · On-time delivery ${PORTFOLIO.onTimeDelivery} (25pp under target)`,
    `• ${PORTFOLIO.revenueAtRisk} of revenue at risk this quarter`,
    ``,
    `Biggest exposures are Xcel Energy (delivery at risk, €4.2M) and Siemens (invoice blocked, €2.4M) - together the bulk of the at-risk revenue. Both have a defined next action.`,
    `Recommended by HMAX: focus this week on the two decisions that move the most - escalate Xcel's schedule and book Siemens CO-118.`,
  ].join("\n");
}

function contextFallback(context: string | undefined, prompt: string): string {
  const base = context ? `Looking at ${context}, ` : "";
  return `${base}I couldn't tie "${prompt.trim()}" to a specific contract or asset. Try asking about a customer (Xcel Energy, Siemens, ComEd…), an asset (AST-001, S-12…), or a topic like margin, on-time delivery, vendor concentration, or SLA renewals.`;
}

/** Returns the customer a piece of text refers to, if any - used to tie a
 *  free-form conversation to a specific account. */
export function detectCustomer(text: string): string | null {
  const q = text.toLowerCase();
  const hit = CONTRACTS.find((c) => q.includes(c.customer.toLowerCase()));
  return hit ? hit.customer : null;
}

export function customerSummary(name: string): string | null {
  const c = CONTRACTS.find((x) => x.customer.toLowerCase() === name.toLowerCase());
  return c ? c.note : null;
}

// Action CTAs resolve to a confirmation rather than a lookup.
const ACTION_RE = /^(escalate|request|raise|draft|schedule|generate|prepare|flag|propose|review|order|assign|reassign|adjust|document|mark|add|create)\b/i;

/* ── Answers for the work each role actually asks about ──────────────
   The openers and follow-ups offered in the product all land on one of
   these, so no suggested question drops through to the generic fallback. */

function peopleAnswer(): string {
  const busiest = [...PEOPLE].sort((a, b) => b.allocation - a.allocation);
  const stretched = busiest.filter((p) => p.allocation >= 85);
  const free = busiest.filter((p) => p.allocation < 85);
  return [
    `${stretched.length} of ${PEOPLE.length} engineers are at or above 85% allocation.`,
    ...busiest.map((p) => `• ${p.name} - ${p.role} · ${p.allocation}% allocated · ${p.location}`),
    ``,
    free.length
      ? `${free[free.length - 1].name} has the most headroom at ${free[free.length - 1].allocation}%. Certifications: ${free[free.length - 1].certifications.map((c) => c.name).join(", ")}.`
      : `Everyone is at capacity - anything new needs a re-plan, not an assignment.`,
    ``,
    `Recommended by HMAX: move work off ${busiest[0].name} before adding anything new - at ${busiest[0].allocation}% there is no float left for a slip.`,
  ].join("\n");
}

function constraintAnswer(): string {
  const conflicts = SITE_CONSTRAINTS.filter((c) => c.status === "conflict");
  return [
    `${conflicts.length} of ${SITE_CONSTRAINTS.length} site constraints conflict with what was assumed at handover.`,
    ...conflicts.map((c) => `• ${c.asset} - ${c.type}: handover assumed ${c.handover}; site is ${c.actual}`),
    ``,
    `Recommended by HMAX: resolve the ${conflicts[0].type.toLowerCase()} on ${conflicts[0].asset} first - it blocks mobilisation rather than just slowing it.`,
  ].join("\n");
}

function alertsByCategory(category: string, label: string): string {
  const rows = OPS_CONTRACTS.flatMap((c) =>
    (c.alerts ?? []).filter((a) => a.category === category).map((a) => ({ customer: c.customer, ...a }))
  );
  if (!rows.length) return `No open ${label} right now across the portfolio.`;
  return [
    `${rows.length} open ${label} across ${new Set(rows.map((r) => r.customer)).size} contracts:`,
    ...rows.map((r) => `• ${r.customer} - ${r.title}${r.impact ? ` · ${r.impact}` : ""}`),
    ``,
    `Recommended by HMAX: ${rows[0].action} on the ${rows[0].customer} item first - ${rows[0].impact ?? "it is the one holding progress"}.`,
  ].join("\n");
}

function assetReviewAnswer(): string {
  const byHealth = [...ASSET_REVIEW_ALERTS].sort((a, b) => a.health - b.health);
  return [
    `${byHealth.length} assets are waiting on your review, worst health first:`,
    ...byHealth.map((a) => `• ${a.code} - ${a.health}% health · ${a.alert?.title ?? "review pending"}`),
    ``,
    `Recommended by HMAX: start with ${byHealth[0].code} at ${byHealth[0].health}% - ${byHealth[0].alert?.impact ?? "it carries the most risk"}.`,
  ].join("\n");
}

function fieldReportAnswer(): string {
  const waiting = [...REPORTS_AWAITING].sort((a, b) => b.waitingDays - a.waitingDays);
  const signatures = waiting.filter((r) => r.faultSignature);
  return [
    `${waiting.length} field reports are waiting on interpretation; ${signatures.length} carry a fault signature.`,
    ...waiting.slice(0, 5).map((r) => `• ${r.code} - ${r.asset} · ${r.type} · ${r.waitingDays}d waiting${r.faultSignature ? " · fault signature" : ""}`),
    ``,
    `Turnaround is ${REPORT_TURNAROUND.actualDays} days against a ${REPORT_TURNAROUND.targetDays}-day target. The slowest stage is ${[...REPORT_TURNAROUND.stages].sort((a, b) => b.days - a.days)[0].label} at ${[...REPORT_TURNAROUND.stages].sort((a, b) => b.days - a.days)[0].days} days.`,
    ``,
    `Recommended by HMAX: interpret ${signatures[0].code} (${signatures[0].asset}) first - ${signatures[0].finding}`,
  ].join("\n");
}

function dgaAnswer(): string {
  const dga = ASSET_REPORT_ALERTS.filter((a) => /dga|gas|oil/i.test(`${a.alert?.title} ${a.alert?.detail}`));
  const rows = dga.length ? dga : ASSET_REPORT_ALERTS;
  return [
    `${rows.length} asset reports point at gas or oil behaviour:`,
    ...rows.slice(0, 4).map((a) => `• ${a.code} - ${a.alert?.title} · ${a.health}% health`),
    ``,
    `Recommended by HMAX: ${rows[0].alert?.action ?? "Review the report"} on ${rows[0].code} - ${rows[0].alert?.impact ?? "it is the clearest signal in the set"}.`,
  ].join("\n");
}

function offerReadinessAnswer(): string {
  const leads = OPPORTUNITIES.filter((o) => o.requirements?.length);
  const ready = leads.filter((o) => o.requirements.every((r) => r.done));
  const blocked = leads
    .map((o) => ({ o, missing: o.requirements.filter((r) => !r.done) }))
    .filter((x) => x.missing.length)
    .sort((a, b) => a.missing.length - b.missing.length);
  return [
    `${ready.length} of ${leads.length} leads have every offer input in place.`,
    ...blocked.slice(0, 4).map((x) => `• ${x.o.account} - ${x.o.title} · ${x.missing.length} still needed: ${x.missing.map((m) => m.label).join(", ")}`),
    ``,
    blocked.length
      ? `Recommended by HMAX: close ${blocked[0].o.account} first - it is ${blocked[0].missing.length} input${blocked[0].missing.length > 1 ? "s" : ""} from an offer, the shortest path to ${blocked[0].o.value}.`
      : `Recommended by HMAX: build the offers now - nothing is outstanding.`,
  ].join("\n");
}

/* Artefacts a guided flow just produced - the follow-ups under a finished
   flow ask about these, so they answer from what the flow created. */
const ARTIFACTS: { match: RegExp; answer: string }[] = [
  { match: /(impact report|the report|period does it cover)/i, answer: "The impact report covers last quarter for the Xcel Energy portfolio, focused on reliability, written for a customer audience with charts included.\n\nIt leads on the avoided-failure story for AST-001 and the on-time delivery trend.\n\nRecommended by HMAX: send it with a short covering note that names the two numbers you want remembered." },
  { match: /(renewal quote|the quote|the uplift)/i, answer: "The renewal quote carries a 3% uplift over a 5-year term, drafted against the current agreement.\n\nThe uplift sits below the 4.2% you took at the last renewal, so there is room if the customer pushes on scope instead of price.\n\nRecommended by HMAX: send it for approval now - the renewal window closes before the next review cycle." },
  { match: /(inspection plan|the plan|first window)/i, answer: "The inspection plan schedules quarterly thermal and DGA checks against AST-001, with an engineer assigned to the first window.\n\nThe first window pairs a thermal scan with an oil sample, so a single visit covers both the hotspot and the gas trend.\n\nRecommended by HMAX: put it on the maintenance calendar so the window is protected before the autumn peak." },
  { match: /(feasibility review|the review|constraints did it find)/i, answer: "The feasibility review checks the proposed scope against the asset: the continuous-load uplift pushes AST-001 past its 65 °C temp-rise limit, so it is feasible only with a cooling upgrade.\n\nThe constraint is thermal headroom, not access or outage length.\n\nRecommended by HMAX: flag the design constraint on the handover and let sales price the cooling upgrade into the offer." },
  { match: /(the assignment|the site brief|this visit)/i, answer: "The visit is assigned with the site brief attached - scope, access notes and the reports the engineer needs on arrival.\n\nRecommended by HMAX: send the brief today so any access question is answered before the crew travels." },
  { match: /(diagnostics summary|the summary|trend point to)/i, answer: "The diagnostics summary reads the reports together: a thermal hotspot on the Y-phase bushing, hydrogen elevated but stable, and partial-discharge activity on the tap-changer.\n\nThe trend points at insulation wear rather than an isolated fault - each signal on its own is tolerable, together they are not.\n\nRecommended by HMAX: raise a corrective contract before the autumn peak." },
  { match: /(the message|who else should see)/i, answer: "The message is drafted and ready to send, with the contract, the ask and the date it is needed by.\n\nThe account owner and the delivery lead are the two people who need it; copy the commercial lead if it changes what gets invoiced.\n\nRecommended by HMAX: send it today and schedule a reminder for the response date." },
];

/* ── Intent answers ──────────────────────────────────────────────────
   A subject lookup alone makes every follow-up about the same customer or
   asset return the same paragraph. These run first so "who owns it", "what
   are the milestones" and "why is it late" each answer the question asked. */

interface Intent {
  match: RegExp;
  answer: (subject: { customer: KBContract | null; asset: KBAsset | null }) => string | null;
}

const rec = (line: string) => `\nRecommended by HMAX: ${line}`;

const INTENTS: Intent[] = [
  // ── About a specific customer ──
  {
    match: /who owns|account owner|who.s responsible/i,
    answer: ({ customer }) =>
      customer &&
      `${customer.owner} owns ${customer.customer} - ${customer.region}, ${customer.value} of contract value at ${customer.margin} margin.\n\nThey are the approval route for anything that changes the delivery date or the invoicing schedule.${rec(`bring ${customer.owner} in before committing to a new date with ${customer.customer}.`)}`,
  },
  {
    match: /(next )?milestones?/i,
    answer: ({ customer }) => {
      const rows = MILESTONES.filter((m) => !customer || m.startsWith(customer.customer));
      if (!rows.length) return null;
      const who = customer ? customer.customer : "the portfolio";
      return [
        `Next milestones for ${who}:`,
        ...rows.map((m) => `• ${m}`),
        ``,
        customer ? `Due date on the contract is ${customer.due}.` : `Ordered by how soon they fall due.`,
        rec(`work the late one first - everything behind it moves with it.`),
      ].join("\n");
    },
  },
  {
    match: /open risks?|what risks/i,
    answer: ({ customer }) =>
      customer &&
      [
        `Open risks on ${customer.customer}:`,
        `• ${customer.status} - the headline flag on the contract`,
        `• Margin at ${customer.margin}, against a 18.6% portfolio average`,
        `• ${customer.note}`,
        ``,
        rec(`clear the ${customer.status.toLowerCase()} first - the other two follow from it.`),
      ].join("\n"),
  },
  {
    match: /(why|what).*(late|behind|slipping|at risk|putting)/i,
    answer: ({ customer }) =>
      customer &&
      [
        `${customer.customer} is ${customer.status.toLowerCase()} because of one thing, not several:`,
        ``,
        customer.note,
        ``,
        `Owner ${customer.owner} · ${customer.value} · due ${customer.due}.`,
        rec(CONTRACT_NEXT[customer.status] ?? "review it with the account owner."),
      ].join("\n"),
  },
  // ── About a specific asset ──
  {
    match: /repair history|service history|past repairs/i,
    answer: ({ asset }) =>
      asset &&
      [
        `Repair history for ${asset.code}:`,
        `• Seal replacement - Jan 2026`,
        `• Bearing inspection - Nov 2025`,
        `• Motor vibration check - Aug 2025`,
        ``,
        `Three interventions in twelve months on a unit commissioned in ${asset.commissioned}. The interval is shortening, which reads as wear rather than isolated faults.`,
        rec(`price a replacement against continued repair - cumulative spend is approaching a like-for-like swap.`),
      ].join("\n"),
  },
  {
    match: /health trend|condition trend|trending/i,
    answer: ({ asset }) =>
      asset &&
      [
        `${asset.code} health trend: 62 → 54 → 41 → ${String(asset.health).replace(/[^0-9]/g, "") || "24"} over four quarters.`,
        ``,
        `The decline is steepening rather than levelling off, and the current reading of ${asset.health} sits below the 60 threshold where assets move into the review queue.`,
        rec(`schedule the diagnostic now - the curve says this does not recover on its own.`),
      ].join("\n"),
  },
  {
    match: /(what|whats).*driving.*(condition|health)|why.*(degrad|declin)/i,
    answer: ({ asset }) =>
      asset &&
      [
        `What's driving ${asset.code}:`,
        ``,
        asset.note,
        ``,
        `${asset.type} · ${asset.location} · commissioned ${asset.commissioned}. Age is the background factor; the immediate driver is the condition signal above.`,
        rec(`confirm it with a diagnostic before committing to a repair scope.`),
      ].join("\n"),
  },
  // ── Vendors ──
  {
    match: /which projects depend|projects depend on|depends on/i,
    answer: () =>
      [
        `Delta Coils Inc. is the critical dependency on 6 projects:`,
        `• Sherco HVDC winding replacement - Xcel Energy · €4.2M`,
        `• North Sea switchgear refurbishment - Siemens · €2.4M`,
        `• Baltic array transformer maintenance - Baltic Wind NL · €2.4M`,
        `• Protection relay upgrade - Pacific Gas · €440k`,
        `• ComEd substation upgrade · €4.8M`,
        `• AEP Ohio converter replacement · €6.2M`,
        ``,
        `That is €4.8M of delivery-linked revenue behind a single supplier.`,
        rec(`treat this as one concentration decision, not six delivery problems.`),
      ].join("\n"),
  },
  {
    match: /alternative supplier|other suppliers|second source/i,
    answer: () =>
      [
        `Alternatives to Delta Coils on the winding sets:`,
        `• Nexans - qualified, 3 projects running, 5-week lead`,
        `• Nynas AB - qualified for oil only, not windings`,
        `• Air Liquide - gas supply, not a substitute`,
        ``,
        `Only Nexans is a like-for-like on the critical item, and their lead time is two weeks longer than the Delta Coils revised date.`,
        rec(`dual-source the next winding order rather than switching the open one mid-delivery.`),
      ].join("\n"),
  },
  {
    match: /total revenue exposure|how much.*exposed|total exposure/i,
    answer: () =>
      [
        `Total exposure behind vendor concentration: €7.1M.`,
        ``,
        `• Delta Coils Inc. - €4.8M across 6 projects`,
        `• Nexans - €1.4M across 3`,
        `• Nynas AB - €0.6M across 2`,
        `• Air Liquide - €0.3M on 1`,
        ``,
        `Delta Coils alone is 68% of it.`,
        rec(`cap the concentration before the next award rather than after the next slip.`),
      ].join("\n"),
  },
  // ── Money ──
  {
    match: /blocking the xcel invoice|what.s blocking.*invoice|why.*invoice.*blocked/i,
    answer: () =>
      [
        `The €1.2M Xcel invoice is blocked on site commissioning, milestone 4.`,
        ``,
        `Commissioning can't be signed off until the winding set is installed, and the winding set is the Delta Coils item running 18 days late. The invoice is downstream of the delivery slip, not a billing problem.`,
        rec(`raise the transformer gasket-set PO today - it is the longest lead item at 35 days and the only thing between here and sign-off.`),
      ].join("\n"),
  },
  {
    match: /invoices? can be released|which invoices|release now/i,
    answer: () =>
      [
        `Two invoices can be released this week:`,
        `• Siemens - €680k, held only on the CO-118 signature`,
        `• ComEd - €1.1m, milestone complete, awaiting customer sign-off`,
        ``,
        `Both are administrative rather than delivery-blocked, so ~€1.8m is recoverable this quarter without any site work.`,
        rec(`chase the two signatures today - they are the cheapest revenue in the book.`),
      ].join("\n"),
  },
  {
    match: /revenue at risk by customer|by customer/i,
    answer: () =>
      [
        `Revenue at risk by customer:`,
        `• Xcel Energy - €4.2M · delivery slip`,
        `• Siemens - €2.4M · invoice blocked on CO-118`,
        `• Baltic Wind NL - €0.4M · scope creep`,
        `• Pacific Gas - €0.1M · site access`,
        ``,
        `Xcel and Siemens are 93% of the total between them.`,
        rec(`work those two accounts and the rest can wait.`),
      ].join("\n"),
  },
  {
    match: /drag margin|lowest margin|worst margin/i,
    answer: () =>
      [
        `Contracts dragging portfolio margin hardest:`,
        ...CONTRACTS.slice()
          .sort((a, b) => parseFloat(a.margin) - parseFloat(b.margin))
          .slice(0, 4)
          .map((c) => `• ${c.customer} - ${c.margin} · ${c.status} · ${c.value}`),
        ``,
        `Siemens is the outlier: 11.8% against a 18.6% portfolio average, and it is entirely the unbooked change order.`,
        rec(`book CO-118 - it recovers the margin without touching the delivery plan.`),
      ].join("\n"),
  },
  {
    match: /compare to plan|versus plan|vs plan|against plan/i,
    answer: () =>
      [
        `Margin against plan: 18.6% actual versus 19.4% as-sold - 0.8pp under.`,
        ``,
        `The gap is three months old and widening. Change orders booked late account for roughly half of it; the rest is weather standby and additional crew days on the Xcel recovery.`,
        rec(`book the open change orders before quarter end - that closes most of the gap on paper and in cash.`),
      ].join("\n"),
  },
  // ── Renewals ──
  {
    match: /renewals? (are )?at risk|which renewals.*risk|why.*renewal/i,
    answer: () =>
      [
        `3 of 12 renewals are flagged at risk:`,
        `• AEP Ohio - €6.2M · asset health declining, the largest in the book`,
        `• ComEd - €4.8M · open service issues unresolved`,
        `• Duke Energy - €5.4M · on watch, no service history to defend the price`,
        ``,
        `All three are condition problems rather than commercial ones, which means they are fixable before the renewal date.`,
        rec(`commission a condition assessment on AEP Ohio first - it is the biggest and the furthest from defensible.`),
      ].join("\n"),
  },
  {
    match: /total renewal value|renewal value|how much.*renewals/i,
    answer: () =>
      [
        `Total renewal value in the next 60 days: ~€18.5M across 12 agreements.`,
        ``,
        `• At risk - €16.4M (AEP Ohio, ComEd, Duke Energy)`,
        `• Verified - €2.1M (NV Energy)`,
        ``,
        `The concentration is unusual: three accounts carry 89% of the value up for renewal.`,
        rec(`protect the three big ones individually rather than running one renewal campaign.`),
      ].join("\n"),
  },
  {
    match: /renewals need attention first|which renewals first|prioriti.*renewal/i,
    answer: () =>
      [
        `Renewal order, by value at risk and days remaining:`,
        `1. ComEd - €4.8M · 22 days · open service issues`,
        `2. NV Energy - €2.1M · 31 days · verified, low effort`,
        `3. AEP Ohio - €6.2M · 38 days · asset health declining`,
        `4. Duke Energy - €5.4M · 58 days · on watch`,
        ``,
        `ComEd is first on the clock, AEP Ohio is first on value - and AEP Ohio needs the longest lead time because a condition assessment takes three weeks.`,
        rec(`start the AEP Ohio assessment now and close ComEd's service issues in parallel.`),
      ].join("\n"),
  },
  // ── Fleet ──
  {
    match: /which assets are critical|critical assets/i,
    answer: () =>
      [
        `2 assets are critical and 3 more sit under 60:`,
        ...ASSETS.filter((a) => a.status === "Critical" || a.status === "At Risk")
          .slice(0, 5)
          .map((a) => `• ${a.code} - ${a.health} · ${a.status} · ${a.location}`),
        ``,
        `AST-001 and AST-002 are the two criticals, both in Zone A, both commissioned before 2012.`,
        rec(`run the AST-001 diagnostic first - lowest health, and it feeds two pump lines with no standby.`),
      ].join("\n"),
  },
  {
    match: /fleet health trend|health trend across|trend.*fleet/i,
    answer: () =>
      [
        `Fleet health trend: 83 → 81 → 78 → 76 → 73 → 71 over six months.`,
        ``,
        `A 12-point fall with no flattening. The decline is concentrated in Zone A - the rest of the estate is broadly flat, so this is a location problem rather than a fleet-wide one.`,
        rec(`treat Zone A as one programme instead of four separate asset reviews.`),
      ].join("\n"),
  },
  {
    match: /driving.*(fleet health|decline)|why.*fleet/i,
    answer: () =>
      [
        `What's driving the fleet health decline:`,
        `• AST-001 and AST-002 at 24% and 31% - both Zone A, both pre-2012`,
        `• Repeat-repair pattern on AST-002: three interventions in twelve months`,
        `• Deferred inspections - 5 overdue, all in the same zone`,
        ``,
        `Two ageing units and a maintenance backlog in one location account for almost the whole 12-point drop.`,
        rec(`clear the Zone A inspection backlog before adding new condition monitoring elsewhere.`),
      ].join("\n"),
  },
  // ── Portfolio ──
  {
    match: /needs my attention today|what should i do today|my attention/i,
    answer: () =>
      [
        `Three things today, in order:`,
        `1. Xcel Energy - raise the gasket-set PO. 35-day lead, and the €1.2M invoice sits behind it.`,
        `2. Siemens - chase the CO-118 signature. €680k released the day it is booked.`,
        `3. AEP Ohio - start the condition assessment. Three-week lead against a 38-day renewal.`,
        ``,
        `Everything else on the board can wait a week without changing outcome.`,
        rec(`do the two signatures first - they are minutes of work for €1.9M of movement.`),
      ].join("\n"),
  },
];

function intentAnswer(prompt: string, customer: KBContract | null, asset: KBAsset | null): string | null {
  for (const intent of INTENTS) {
    if (!intent.match.test(prompt)) continue;
    const out = intent.answer({ customer, asset });
    if (out) return out;
  }
  return null;
}

export function answerQuery(prompt: string, context?: string): string {
  const q = prompt.toLowerCase();

  // Proactive action taken from a CTA - acknowledge it.
  if (ACTION_RE.test(prompt.trim())) {
    return `On it. I've actioned "${prompt.trim()}" and notified the relevant owners - you'll see it reflected in the project record.`;
  }

  // Which record is this about?
  const assetMatch = q.match(/\b([a-z]{1,3}-?\s?0*\d{1,3})\b/);
  const namedAsset = assetMatch
    ? ASSETS.find((x) => x.code.toLowerCase() === normalizeAssetCode(assetMatch[1]).toLowerCase()) ?? null
    : null;
  const namedCustomer = CONTRACTS.find((x) => q.includes(x.customer.toLowerCase())) ?? null;

  // What is actually being asked about it - checked before the record lookup,
  // so two questions about one contract don't return the same paragraph.
  const byIntent = intentAnswer(prompt, namedCustomer, namedAsset);
  if (byIntent) return byIntent;

  if (namedAsset) return formatAsset(namedAsset);

  // Contract lookup - by its own name ("Sherco HVDC winding replacement") as
  // well as by the customer, since that is how a drawer asks about one.
  const named = OPS_CONTRACTS.find((x) => q.includes(x.name.toLowerCase()));
  const byName = named && CONTRACTS.find((x) => x.customer === named.customer);
  if (byName) return formatContract(byName);

  // Customer lookup
  const c = CONTRACTS.find((x) => q.includes(x.customer.toLowerCase()));
  if (c) return formatContract(c);

  // Artefacts a flow has just produced
  const artifact = ARTIFACTS.find((a) => a.match.test(q));
  if (artifact) return artifact.answer;

  // The work each role asks about
  if (/(over-?allocat|spare capacity|who on my team|which engineers|certification|competenc|crew|who else could cover)/.test(q)) return peopleAnswer();
  if (/(site constraint|handover)/.test(q)) return constraintAnswer();
  if (/change order/.test(q)) return alertsByCategory("change-order", "change orders");
  if (/(hse|riddor|non-?conformance|\bncr\b|quality issue|quality non)/.test(q)) return alertsByCategory("hse", "HSE and quality issues");
  if (/(need my review|review first|assets? to review|trending toward failure|condition data|feasibility)/.test(q)) return assetReviewAnswer();
  if (/(field report|interpretation|turnaround|fault signature)/.test(q)) return fieldReportAnswer();
  if (/\bdga\b/.test(q)) return dgaAnswer();
  if (/(offer stage|reach the offer|offer readiness|at offer)/.test(q)) return offerReadinessAnswer();

  // Topic keywords
  if (/(vendor|delta coils|concentration|supplier)/.test(q)) return vendorAnswer();
  if (/(sla|renewal|pipeline)/.test(q)) return slaAnswer();
  if (/(on.?time|delivery|late|cotd)/.test(q)) return deliveryAnswer();
  if (/(margin|profit)/.test(q)) return marginAnswer();
  if (/(invoice|billing|revenue)/.test(q)) return revenueAnswer();
  if (/(fleet|health|score)/.test(q)) return fleetAnswer();
  if (/(milestone|upcoming|due)/.test(q)) return milestoneAnswer();
  // An asset question about condition is about the fleet, not the contract book
  if (/asset/.test(q) && /(critical|health|declin|fail)/.test(q)) return fleetAnswer();
  if (/(risk|critical|at.?risk|attention)/.test(q)) return riskAnswer();
  if (/(contract|portfolio|account|overview)/.test(q)) return portfolioAnswer();

  return contextFallback(context, prompt);
}

/* ── Proactive suggestions ───────────────────────────────────────── */

export interface Suggestions {
  /** Follow-up questions the user can tap to keep exploring. */
  prompts: string[];
  /** Proactive next-step CTAs that trigger an action. */
  actions: { label: string; prompt: string }[];
}

/** The two things offered under a reply, labelled so the set reads as clear
 *  categories rather than a row of undifferentiated chips. */
export const FOLLOW_UP_LABEL = "Follow-ups";
export const RECOMMENDATION_LABEL = "Recommended by HMAX";

// Given the user's prompt (and optional widget context), suggest where to go
// next. Every set is built the same way: why it's happening, what else is
// worth looking at, then what to do about it. Every reply gets both halves -
// questions to keep pulling on, and next steps to take.
export function suggestNext(prompt: string, context?: string): Suggestions {
  const set = buildSuggestions(prompt, context);
  // Never offer back the question that was just asked.
  const asked = prompt.trim().toLowerCase();
  return { ...set, prompts: set.prompts.filter((p) => p.trim().toLowerCase() !== asked) };
}

function buildSuggestions(prompt: string, context?: string): Suggestions {
  const q = prompt.toLowerCase();
  const cust = detectCustomer(prompt);
  const assetMatch = q.match(/\b([a-z]{1,3}-?\s?0*\d{1,3})\b/);
  const asset = assetMatch ? normalizeAssetCode(assetMatch[1]) : null;
  const assetExists = !!asset && ASSETS.some((a) => a.code.toLowerCase() === asset!.toLowerCase());

  if (assetExists) {
    return {
      prompts: [`What's driving the condition of ${asset}?`, `Show repair history for ${asset}`, `What's the health trend for ${asset}?`],
      actions: [
        { label: "Schedule inspection", prompt: `Schedule an inspection for ${asset}` },
        { label: "Create contract", prompt: `Create a contract for ${asset}` },
      ],
    };
  }
  if (/(vendor|delta coils|supplier|concentration)/.test(q)) {
    return {
      prompts: ["Why is Delta Coils behind?", "Which projects depend on Delta Coils?", "Are there alternative suppliers?", "What's the total revenue exposure?"],
      actions: [
        { label: "Request vendor update", prompt: "Request a delivery update from Delta Coils Inc." },
        { label: "Draft risk summary", prompt: "Draft a vendor concentration risk summary" },
      ],
    };
  }
  if (/(on.?time|delivery|late|cotd)/.test(q)) {
    return {
      prompts: ["Why is Xcel Energy late?", "Which milestones are at risk?", "Compare delivery against target"],
      actions: [
        { label: "Escalate delivery risk", prompt: "Escalate the delivery risk to the account owner" },
        { label: "Adjust schedule", prompt: "Propose an adjusted mobilization schedule for Xcel Energy" },
      ],
    };
  }
  if (/margin/.test(q)) {
    return {
      prompts: ["Which contracts drag margin the most?", "Show the Siemens change-order impact", "How does margin compare to plan?"],
      actions: [{ label: "Flag for review", prompt: "Flag the low-margin contracts for portfolio review" }],
    };
  }
  if (/(invoice|billing|revenue|risk\b)/.test(q)) {
    return {
      prompts: ["What's blocking the Xcel invoice?", "Show revenue at risk by customer", "Which invoices can be released now?"],
      actions: [
        { label: "Raise purchase order", prompt: "Raise the purchase order for the transformer gasket set" },
        { label: "Create invoice", prompt: "Create an invoice for the completed Xcel milestones" },
      ],
    };
  }
  if (/(sla|renewal|pipeline)/.test(q)) {
    return {
      prompts: ["Which renewals are at risk, and why?", "Show the AEP Ohio status", "What's the total renewal value?", "Which renewals need attention first?"],
      actions: [{ label: "Prepare renewal pack", prompt: "Prepare the SLA renewal pack for the at-risk accounts" }],
    };
  }
  if (/(fleet|health|score|asset|critical|repair)/.test(q)) {
    return {
      prompts: ["What's driving the fleet health decline?", "Which assets are critical?", "Show the fleet health trend"],
      actions: [{ label: "Review critical assets", prompt: "Review the critical assets and recommend actions" }],
    };
  }
  if (cust) {
    return {
      prompts: [`What's putting the ${cust} contract at risk?`, `Show open risks for ${cust}`, `What are the next milestones for ${cust}?`, `Who owns the ${cust} account?`],
      actions: [
        { label: "Generate project status", prompt: `Generate a project status report for ${cust}` },
        { label: "Start a mobilization plan", prompt: `Create a mobilization plan for ${cust}` },
      ],
    };
  }
  if (context) {
    return {
      prompts: [`Break down ${context} by driver`, `How does ${context} compare to plan?`],
      actions: [
        { label: "Add to my report", prompt: `Add ${context} to my weekly report` },
        { label: "Flag for review", prompt: `Flag ${context} for review with the owner` },
      ],
    };
  }
  return {
    prompts: ["Show the portfolio overview", "Which contracts are at risk?", "What needs my attention today?"],
    actions: [
      { label: "Add to my report", prompt: "Add the portfolio overview to my weekly report" },
      { label: "Review at-risk contracts", prompt: "Review the at-risk contracts and recommend actions" },
    ],
  };
}

/* ── Inline data visuals ─────────────────────────────────────────── */

const VIZ_MONTHS = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];

function viz(title: string, type: WidgetType, series: { label: string; value: number }[], unit?: string): CustomWidgetConfig {
  return { id: `viz-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title, type, series, unit };
}

// A chart to accompany a topic answer, where one adds value. Detail lookups
// (a specific customer/asset) and action confirmations get no chart, so the
// visual always matches the text.
export function visualFor(prompt: string, context?: string): CustomWidgetConfig | null {
  const q = prompt.toLowerCase();

  if (ACTION_RE.test(prompt.trim())) return null;

  // Specific asset or customer → text detail, no topic chart
  const assetMatch = q.match(/\b([a-z]{1,3}-?\s?0*\d{1,3})\b/);
  if (assetMatch) {
    const code = normalizeAssetCode(assetMatch[1]);
    if (ASSETS.some((a) => a.code.toLowerCase() === code.toLowerCase())) return null;
  }
  if (detectCustomer(prompt)) return null;

  // Topic charts - order mirrors answerQuery so text and visual agree.
  if (/(vendor|delta coils|concentration|supplier)/.test(q))
    return viz("Revenue at risk by vendor", "bar", VENDORS.map((v) => ({ label: v.name.replace(" Inc.", ""), value: parseFloat(v.amount.replace(/[^0-9.]/g, "")) })), "€M");

  if (/(sla|renewal|pipeline)/.test(q))
    return viz("Upcoming SLA renewals", "line", VIZ_MONTHS.map((m, i) => ({ label: m, value: [8, 9, 11, 12, 12, 12][i] })));

  if (/(on.?time|delivery|late|cotd)/.test(q))
    return viz("On-time delivery - 6 mo", "line", VIZ_MONTHS.map((m, i) => ({ label: m, value: [78, 74, 70, 68, 64, 60][i] })), "%");

  if (/(margin|profit)/.test(q))
    return viz("Portfolio margin - 6 mo", "line", VIZ_MONTHS.map((m, i) => ({ label: m, value: [19.4, 19.0, 18.9, 18.7, 18.6, 18.6][i] })), "%");

  if (/(invoice|billing|revenue)/.test(q))
    return viz("Revenue at risk by trigger", "bar", [
      { label: "Delivery slip", value: 4.8 },
      { label: "Invoice blocked", value: 1.2 },
      { label: "Change order", value: 0.7 },
      { label: "Scope creep", value: 0.4 },
    ], "€M");

  if (/(fleet|health|score)/.test(q))
    return viz("Fleet health - 6 mo", "line", VIZ_MONTHS.map((m, i) => ({ label: m, value: [83, 86, 80, 68, 72, 71][i] })));

  if (/(risk|critical|at.?risk|attention|contract|portfolio|account|overview)/.test(q))
    return viz("Contracts by status", "donut", [
      { label: "Healthy", value: PORTFOLIO.activeContracts - PORTFOLIO.contractsAtRisk },
      { label: "At risk", value: PORTFOLIO.contractsAtRisk },
    ]);

  if (context)
    return viz(context, "line", VIZ_MONTHS.map((m, i) => ({ label: m, value: [62, 60, 58, 61, 59, 57][i] })));

  return null;
}

// Starter prompts tailored to a specific widget, matched by its title/topic.
export function widgetStarters(title: string): string[] {
  const q = title.toLowerCase();

  if (/vendor|supplier|concentration/.test(q))
    return ["Which projects depend on Delta Coils?", "Are there alternative suppliers?", "What's the total revenue exposure?"];
  if (/sla|renewal|pipeline/.test(q))
    return ["Which renewals need attention first?", "Show the AEP Ohio status", "What's the total renewal value?"];
  if (/map/.test(q))
    return ["Where are the critical assets?", "Which regions are most at risk?", "Show fleet health by location"];
  if (/(on.?time|delivery)/.test(q))
    return ["Why is on-time delivery falling?", "Which projects are running late?", "How do we get back to the 85% target?"];
  if (/margin|profit/.test(q))
    return ["Which contracts drag margin the most?", "What's the Siemens change-order impact?", "How does margin compare to plan?"];
  if (/milestone/.test(q))
    return ["What's overdue right now?", "Which milestones are at risk this week?", "What's blocking Xcel's mobilization?"];
  if (/revenue/.test(q))
    return ["What's driving revenue at risk?", "What's blocking the Xcel invoice?", "Which invoices can be released now?"];
  if (/contract/.test(q))
    return ["Which contracts are at risk?", "Show contracts by status", "Which need action this week?"];
  if (/repair/.test(q))
    return ["Which assets repeat-fail the most?", "Show AST-002's repair history", "What's the replacement recommendation?"];
  if (/asset|critical|fleet|health|score|at.?risk|alert/.test(q))
    return ["Which assets are critical?", "Show the health trend", "What's driving the decline?"];
  if (/assigned|attention/.test(q))
    return ["What needs my attention first?", "Which items are critical?", "What action should I take?"];

  return ["What needs my attention today?", "Show the portfolio overview", "Which contracts are at risk?"];
}
