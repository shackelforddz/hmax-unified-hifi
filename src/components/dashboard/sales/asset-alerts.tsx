"use client";

import { useMemo, useState } from "react";
import AlertsWidget from "@/components/dashboard/alerts-widget";
import AssetDrawer from "./asset-drawer";
import { ASSET_ALERTS, ASSET_DETAILS, dgaScore, sensorFaultsFor, type AssetAlert, type AssetCategory } from "@/lib/sales-data";
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
  /** Add each asset's DGA score to the alert meta (Diagnostics). */
  showDgaScore?: boolean;
  /** Put the live sensor faults first. Off for a list that is about the
   *  written reports, where the faults are supporting evidence. */
  faultsLead?: boolean;
}

/* The asset's DGA score as a meta entry, when it has DGA data. */
function dgaMeta(assetId: string) {
  const score = dgaScore(assetId);
  return score === null ? [] : [{ label: "DGA score", value: `${score}/100` }];
}

/* Faults the asset's own sensors are reporting right now, folded into the
   alert list alongside the analyst-written ones. */
const SENSOR_TYPE = "Sensor fault";

export default function AssetAlerts({
  alerts = ASSET_ALERTS,
  categoryOptions = CATEGORY_OPTIONS,
  title = "Asset Alerts",
  showDgaScore = false,
  faultsLead = true,
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

  // Live sensor faults for whichever assets this widget covers.
  const faultItems = useMemo<AlertItem[]>(
    () =>
      alerts.flatMap((a) =>
        sensorFaultsFor(a.id).map((f) => ({
          id: f.id,
          customer: ASSET_DETAILS[a.id]?.related.customer ?? a.code,
          type: SENSOR_TYPE,
          urgency: (f.severity === "critical" ? "critical" : "at-risk") as AlertUrgency,
          title: `${f.fault} · ${a.code}`,
          detail: `${f.sensor} is reading ${f.value} against a limit of ${f.limit}. Live since ${f.detected}, active ${f.active}.`,
          meta: [
            { label: "Asset", value: a.code },
            { label: "Sensor", value: f.sensor },
            { label: "Reading", value: `${f.value} / ${f.limit}` },
            ...(showDgaScore ? dgaMeta(a.id) : []),
            { label: "Active", value: f.active },
          ],
          action: "Schedule inspection",
          entity: { kind: "asset" as const, id: a.id },
          playbook: buildPlaybook("Schedule inspection", `${a.code}: ${f.sensor} reading ${f.value} against a ${f.limit} limit, active ${f.active}.`, {
            title: f.fault,
            assetId: a.id,
          }),
          detailId: a.id,
        }))
      ),
    [alerts, showDgaScore]
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
                ...(showDgaScore ? dgaMeta(a.id) : []),
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
    [alerts, labelFor, showDgaScore]
  );

  // Sensor faults lead by default - they are happening now. A reports list
  // leads with the reports instead, so the cap keeps one per asset.
  const allAlerts = useMemo(
    () => (faultsLead ? [...faultItems, ...items] : [...items, ...faultItems]),
    [faultItems, items, faultsLead]
  );
  const allTypes = useMemo(() => {
    if (faultItems.length === 0) return typeOptions;
    return faultsLead ? [SENSOR_TYPE, ...typeOptions] : [...typeOptions, SENSOR_TYPE];
  }, [faultItems, typeOptions, faultsLead]);

  return (
    <AlertsWidget
      title={title}
      alerts={allAlerts}
      typeOptions={allTypes}
      onOpenDetail={(a) => setDrawerId(a.detailId)}
      emptyLabel="No assets match the selected filters."
    >
      <AssetDrawer assetId={drawerId} onClose={() => setDrawerId(null)} />
    </AlertsWidget>
  );
}
