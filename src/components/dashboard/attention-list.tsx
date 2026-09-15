"use client";

import { useState } from "react";
import AlertsWidget from "./alerts-widget";
import AttentionDrawer from "./attention-drawer";
import { ATTENTION_ITEMS, PM_ALERT_TYPES } from "@/lib/dashboard-data";
import { buildPlaybook } from "@/lib/alert-playbooks";
import { parseMetaString, withImpact, type AlertItem, type AlertUrgency } from "@/lib/alerts";

const TITLE = "Contracts that need your attention";

/** Flatten contracts down to their individual flags - one card per alert. */
function toAlerts(): AlertItem[] {
  return ATTENTION_ITEMS.filter((item) => item.status !== "healthy").flatMap((item) =>
    (item.flags ?? []).map((flag, i) => ({
      id: `${item.id}-${i}`,
      customer: item.customer,
      type: flag.alertType,
      urgency: item.status as AlertUrgency,
      title: flag.title,
      detail: flag.detail,
      meta: withImpact(parseMetaString(item.meta), flag.impact),
      action: flag.action,
      entity: { kind: "customer" as const, name: item.customer },
      playbook: buildPlaybook(flag.action, flag.detail, { title: flag.title }),
      detailId: item.id,
    }))
  );
}

/** Built once - the source records are static module data. */
const ALERTS = toAlerts();

export default function AttentionList() {
  const [drawerId, setDrawerId] = useState<string | null>(null);

  return (
    <AlertsWidget
      title={TITLE}
      alerts={ALERTS}
      typeOptions={PM_ALERT_TYPES}
      onOpenDetail={(a) => setDrawerId(a.detailId)}
      emptyLabel="No contracts match the selected filters."
    >
      <AttentionDrawer itemId={drawerId} onClose={() => setDrawerId(null)} />
    </AlertsWidget>
  );
}
