"use client";

import KpiCard from "@/components/dashboard/kpi-card";
import { OPPORTUNITIES, STAGE_PROB, oppValue as parseVal, type OppStage } from "@/lib/sales-data";

const fmt = (n: number) => `€${n.toFixed(1)}M`;

const OFFER_PLUS: OppStage[] = ["Bidding", "Negotiation"];

/** Where the pipeline stood last month, for the "vs last month" delta. */
const LAST_MONTH = 26.5;

export default function OpportunityStats() {
  const total = OPPORTUNITIES.reduce((s, o) => s + parseVal(o.value), 0);
  const weighted = OPPORTUNITIES.reduce((s, o) => s + parseVal(o.value) * (STAGE_PROB[o.stage] ?? 0), 0);
  const offerPlus = OPPORTUNITIES.filter((o) => OFFER_PLUS.includes(o.stage));
  const offerPlusValue = offerPlus.reduce((s, o) => s + parseVal(o.value), 0);
  const renewals = OPPORTUNITIES.filter((o) => o.category === "Renewal").length;

  const weightedPct = Math.round((weighted / total) * 100);
  const delta = total - LAST_MONTH;

  // Same KpiCard strip every other dashboard opens with.
  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      <KpiCard
        id="pipeline-value"
        label="Pipeline value"
        value={fmt(total)}
        trend={`${fmt(delta)} vs last month`}
        sparkline="portfolio-value"
        direction="up"
      />
      <KpiCard
        id="weighted-forecast"
        label="Weighted forecast"
        value={fmt(weighted)}
        trend={`${weightedPct}% of pipeline`}
        sparkline="revenue-mtd"
        direction="up"
      />
      <KpiCard
        id="at-offer"
        label="At offer or beyond"
        value={String(offerPlus.length)}
        trend={`of ${OPPORTUNITIES.length} leads · ${fmt(offerPlusValue)}`}
        sparkline="active-contracts"
        direction="flat"
      />
      <KpiCard
        id="active-leads"
        label="Active leads"
        value={String(OPPORTUNITIES.length)}
        trend={`${renewals} renewals · ${OPPORTUNITIES.length - renewals} new`}
        sparkline="contracts-at-risk"
        direction="flat"
      />
    </div>
  );
}
