"use client";

import { useState } from "react";
import AlertsWidget from "@/components/dashboard/alerts-widget";
import SlaContractDrawer from "./sla-contract-drawer";
import { ACCOUNT_ATTENTION, type AccountCategory } from "@/lib/accounts-data";
import { buildPlaybook } from "@/lib/alert-playbooks";
import { parseMetaString, withImpact, type AlertItem, type AlertUrgency } from "@/lib/alerts";

const TITLE = "Accounts that need your attention";

/* The alert type badge / tab comes from the flag's own category. */
const CATEGORY_LABEL: Record<AccountCategory, string> = {
  opportunity: "Lead",
  asset: "Asset",
  commercial: "Commercial",
};
const TYPE_OPTIONS = Object.values(CATEGORY_LABEL);

/** Flatten accounts down to their individual flags - one card per alert. */
function toAlerts(): AlertItem[] {
  return ACCOUNT_ATTENTION.flatMap((item) =>
    item.flags.map((flag, i) => ({
      id: `${item.id}-${i}`,
      customer: item.account,
      type: CATEGORY_LABEL[flag.category],
      urgency: item.status as AlertUrgency,
      title: flag.title,
      detail: flag.detail,
      meta: withImpact([...parseMetaString(item.meta), { label: "Owner", value: item.owner }], flag.impact),
      action: flag.action,
      entity: { kind: "customer" as const, name: item.account },
      playbook: buildPlaybook(flag.action, flag.detail, { assetId: flag.assetId, title: flag.title }),
      detailId: item.contractId,
    }))
  );
}

/** Built once - the source records are static module data. */
const ALERTS = toAlerts();

export default function AccountsAttention() {
  const [drawerId, setDrawerId] = useState<string | null>(null);

  return (
    <AlertsWidget
      title={TITLE}
      alerts={ALERTS}
      typeOptions={TYPE_OPTIONS}
      onOpenDetail={(a) => setDrawerId(a.detailId)}
      emptyLabel="No accounts match the selected filters."
    >
      <SlaContractDrawer contractId={drawerId} onClose={() => setDrawerId(null)} />
    </AlertsWidget>
  );
}
