"use client";

import { useState } from "react";
import AlertsWidget from "@/components/dashboard/alerts-widget";
import ContractDrawer from "./contract-drawer";
import { OPS_CONTRACTS, type AlertCategory } from "@/lib/operations-data";
import { buildPlaybook } from "@/lib/alert-playbooks";
import { withImpact, type AlertItem, type AlertUrgency } from "@/lib/alerts";

const TITLE = "Contracts needing attention";

/* The alert type badge / tab comes from the alert's own category. */
const CATEGORY_LABEL: Record<AlertCategory, string> = {
  delivery: "Delivery",
  "change-order": "Change order",
  hse: "HSE",
  quality: "Quality",
};
const TYPE_OPTIONS = Object.values(CATEGORY_LABEL);

/** The widget shows the five most pressing alerts, not the whole backlog. */
const MAX_ALERTS = 5;

/** Flatten contracts down to their individual alerts - one card each. */
function toAlerts(): AlertItem[] {
  return OPS_CONTRACTS.flatMap((contract) =>
    contract.alerts.map((alert, i) => ({
      id: `${contract.id}-${i}`,
      customer: contract.customer,
      type: CATEGORY_LABEL[alert.category],
      urgency: contract.status as AlertUrgency,
      title: alert.title,
      detail: alert.detail,
      meta: withImpact(
        [
          { label: "Contract", value: contract.name },
          { label: "Value", value: contract.value },
          { label: "Owner", value: contract.owner },
        ],
        alert.impact
      ),
      action: alert.action,
      entity: { kind: "contract" as const, id: contract.id },
      playbook: buildPlaybook(alert.action, alert.detail, {
        coCode: alert.title.match(/CO-\d+/)?.[0],
        title: alert.title,
      }),
      detailId: contract.id,
    }))
  );
}

const URGENCY_RANK: Record<string, number> = { critical: 0, "at-risk": 1, watch: 2, proposed: 3 };

/** The cap takes the top alert from each contract before taking a second from
 *  any one of them, so a single noisy contract can't fill the whole widget. */
function topAlerts(all: AlertItem[], limit: number): AlertItem[] {
  const byContract = new Map<string, AlertItem[]>();
  for (const a of all) {
    const list = byContract.get(a.detailId) ?? [];
    list.push(a);
    byContract.set(a.detailId, list);
  }
  // Most severe contract first, so the round-robin starts where it matters.
  const queues = [...byContract.values()].sort(
    (a, b) => URGENCY_RANK[a[0].urgency] - URGENCY_RANK[b[0].urgency]
  );

  const out: AlertItem[] = [];
  for (let round = 0; out.length < limit; round++) {
    const before = out.length;
    for (const q of queues) {
      if (out.length >= limit) break;
      if (q[round]) out.push(q[round]);
    }
    if (out.length === before) break; // every queue exhausted
  }
  return out;
}

/** Built once - the source records are static module data. */
const ALERTS = topAlerts(toAlerts(), MAX_ALERTS);

export default function ContractsAttention() {
  const [drawerId, setDrawerId] = useState<string | null>(null);

  return (
    <AlertsWidget
      title={TITLE}
      alerts={ALERTS}
      typeOptions={TYPE_OPTIONS}
      onOpenDetail={(a) => setDrawerId(a.detailId)}
      emptyLabel="No contracts match the selected filters."
    >
      <ContractDrawer contractId={drawerId} onClose={() => setDrawerId(null)} />
    </AlertsWidget>
  );
}
