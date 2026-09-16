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

/** Built once - the source records are static module data. */
const ALERTS = toAlerts();

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
