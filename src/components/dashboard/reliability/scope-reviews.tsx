"use client";

import { useState } from "react";
import AlertsWidget from "@/components/dashboard/alerts-widget";
import ContractDrawer from "@/components/dashboard/operations/contract-drawer";
import { SCOPE_REVIEWS, type ScopeVerdict } from "@/lib/reliability-data";
import { buildPlaybook } from "@/lib/alert-playbooks";
import { withImpact, type AlertItem, type AlertUrgency } from "@/lib/alerts";

const TITLE = "Contracts to review";

/* A review's verdict drives both its type badge and which urgency band it
   falls under - an unreviewed scope needs the same attention as a risky one. */
const VERDICT_LABEL: Record<ScopeVerdict, string> = {
  "not-feasible": "Not feasible",
  "at-risk": "At risk",
  pending: "Awaiting review",
  feasible: "Feasible",
};
const VERDICT_URGENCY: Record<ScopeVerdict, AlertUrgency> = {
  "not-feasible": "critical",
  "at-risk": "at-risk",
  pending: "at-risk",
  feasible: "watch",
};
const TYPE_OPTIONS = [
  VERDICT_LABEL.pending,
  VERDICT_LABEL["at-risk"],
  VERDICT_LABEL["not-feasible"],
  VERDICT_LABEL.feasible,
];

function toAlerts(): AlertItem[] {
  return SCOPE_REVIEWS.map((review) => ({
    id: review.id,
    customer: review.account,
    type: VERDICT_LABEL[review.verdict],
    urgency: VERDICT_URGENCY[review.verdict],
    title: review.scope,
    detail: review.detail,
    meta: withImpact(
      [
        { label: "Value", value: review.value },
        { label: "From", value: review.from },
        { label: "Submitted", value: review.submitted },
      ],
      review.impact
    ),
    action: review.action,
    entity: { kind: "contract" as const, id: review.contractId },
    playbook: buildPlaybook(review.action, review.detail, {
      verdict: review.verdict,
      scope: review.scope,
      value: review.value,
      from: review.from,
      title: `${review.account} - ${review.scope}`,
    }),
    detailId: review.contractId,
  }));
}

/** Built once - the source records are static module data. */
const ALERTS = toAlerts();

export default function ScopeReviews() {
  const [drawerId, setDrawerId] = useState<string | null>(null);

  return (
    <AlertsWidget
      title={TITLE}
      alerts={ALERTS}
      typeOptions={TYPE_OPTIONS}
      onOpenDetail={(a) => setDrawerId(a.detailId)}
      emptyLabel="No scope reviews match the selected filters."
    >
      <ContractDrawer contractId={drawerId} onClose={() => setDrawerId(null)} />
    </AlertsWidget>
  );
}
