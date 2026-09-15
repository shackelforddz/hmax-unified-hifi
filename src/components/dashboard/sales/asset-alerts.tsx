"use client";

import { useMemo, useState } from "react";
import AlertsWidget from "@/components/dashboard/alerts-widget";
import AssetDrawer from "./asset-drawer";
import { ASSET_ALERTS, ASSET_DETAILS, type AssetAlert, type AssetCategory } from "@/lib/sales-data";
import { buildPlaybook } from "@/lib/alert-playbooks";
import { withImpact, type AlertItem, type AlertUrgency } from "@/lib/alerts";

const CATEGORY_OPTIONS: { label: string; value: AssetCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Asset health", value: "asset-health" },
  { label: "Risk building", value: "risk-building" },
  { label: "Offer readiness", value: "offer-readiness" },
  { label: "Missing info", value: "missing-info" },
];

interface AssetAlertsProps {
  alerts?: AssetAlert[];
  categoryOptions?: { label: string; value: AssetCategory | "all" }[];
  title?: string;
}

export default function AssetAlerts({
  alerts = ASSET_ALERTS,
  categoryOptions = CATEGORY_OPTIONS,
  title = "Asset Alerts",
}: AssetAlertsProps = {}) {
  const [drawerId, setDrawerId] = useState<string | null>(null);

  // The type badge/tab uses the same category labels the old filter pills had.
  const labelFor = useMemo(() => {
    const map = new Map(categoryOptions.map((o) => [o.value, o.label]));
    return (c: AssetCategory) => map.get(c) ?? c;
  }, [categoryOptions]);

  const typeOptions = useMemo(
    () => categoryOptions.filter((o) => o.value !== "all").map((o) => o.label),
    [categoryOptions]
  );

  const items = useMemo<AlertItem[]>(
    () =>
      alerts
        .filter((a) => !!a.alert)
        .map((a) => {
          const detail = ASSET_DETAILS[a.id];
          return {
            id: a.id,
            // Assets sit under a customer via their detail record; the asset
            // code is the fallback when there is no detail to read it from.
            customer: detail?.related.customer ?? a.code,
            type: labelFor(a.category),
            urgency: a.status as AlertUrgency,
            title: a.alert!.title,
            detail: a.alert!.detail,
            meta: withImpact(
              [
                { label: "Asset", value: a.code },
                { label: "Location", value: a.location },
                { label: "Health", value: `${a.health}%` },
              ],
              a.alert!.impact
            ),
            action: a.alert!.action,
            entity: { kind: "asset" as const, id: a.id },
            playbook: buildPlaybook(a.alert!.action, a.alert!.detail, {
              title: a.alert!.title,
              assetId: a.id,
            }),
            detailId: a.id,
          };
        }),
    [alerts, labelFor]
  );

  return (
    <AlertsWidget
      title={title}
      alerts={items}
      typeOptions={typeOptions}
      onOpenDetail={(a) => setDrawerId(a.detailId)}
      emptyLabel="No assets match the selected filters."
    >
      <AssetDrawer assetId={drawerId} onClose={() => setDrawerId(null)} />
    </AlertsWidget>
  );
}
