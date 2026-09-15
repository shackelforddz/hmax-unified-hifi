"use client";

import { useMemo, useState } from "react";
import KpiCard from "@/components/dashboard/kpi-card";
import FleetMap from "@/components/dashboard/sales/fleet-map";
import FleetHealth from "@/components/dashboard/sales/fleet-health";
import AssetAlerts from "@/components/dashboard/sales/asset-alerts";
import ReportTurnaround from "@/components/dashboard/diagnostics/report-turnaround";
import PeopleWidget from "@/components/dashboard/people-widget";
import { FIELD_ENGINEERS } from "@/lib/people-data";
import CustomWidgetView from "@/components/dashboard/sales/custom-widget-view";
import CustomWidgetBuilder from "@/components/dashboard/sales/custom-widget-builder";
import { type CustomWidgetConfig } from "@/lib/custom-widget";
import DashboardTabs from "@/components/dashboard/dashboard-tabs";
import AssetsTable from "@/components/dashboard/tables/assets-table";
import { REPORTS_AWAITING, DIAGNOSTICS_STATS, ASSET_REPORT_ALERTS, REPORT_CATEGORY_OPTIONS } from "@/lib/field-reports-data";
import DashboardGrid, { type GridItem } from "@/components/dashboard/dashboard-grid";

const TABS = ["Overview", "Assets"];

const faultSignatureAssets = new Set(
  REPORTS_AWAITING.filter((r) => r.faultSignature).map((r) => r.assetId)
).size;

// Asset-health KPIs counted from the "Asset reports to review" list below.
const diagCritical = ASSET_REPORT_ALERTS.filter((a) => a.status === "critical").length;
const diagAtRisk = ASSET_REPORT_ALERTS.filter((a) => a.status === "at-risk").length;

const KPIS = [
  { id: "reports-awaiting", label: "Reports awaiting interpretation", value: String(ASSET_REPORT_ALERTS.length), trend: "2 vs last week", sparkline: "contracts-at-risk" as const },
  { id: "outstanding-reports", label: "Outstanding reports", value: String(DIAGNOSTICS_STATS.outstandingReports), trend: "3 vs last week", sparkline: "active-contracts" as const },
  { id: "fault-signature", label: "Assets with a fault signature", value: String(faultSignatureAssets), trend: "1 vs last month", sparkline: "portfolio-margin" as const },
];

export default function DiagnosticsDashboard() {
  const [widgets, setWidgets] = useState<CustomWidgetConfig[]>([]);
  const [building, setBuilding] = useState(false);
  const [tab, setTab] = useState("Overview");

  // Draggable widgets, in their default order. Spans are out of 12.
  const gridItems: GridItem[] = useMemo(
    () => [
      {
        // The report KPI strip moves as one block.
        id: "kpis",
        span: 12,
        node: (
          <div className="grid grid-cols-3 gap-4 h-full">
            {KPIS.map((k) => (
              <KpiCard key={k.id} {...k} />
            ))}
          </div>
        ),
      },
      { id: "report-turnaround", span: 12, tile: true, node: <ReportTurnaround /> },
      {
        id: "reports-to-review",
        span: 12,
        node: <AssetAlerts alerts={ASSET_REPORT_ALERTS} categoryOptions={REPORT_CATEGORY_OPTIONS} title="Asset reports to review" />,
      },
      { id: "fleet-map", span: 8, tile: true, node: <FleetMap /> },
      {
        id: "fleet-health",
        span: 4,
        node: (
          <div className="flex flex-col gap-4">
            <FleetHealth />
            <KpiCard id="critical-assets" label="Critical assets" value={String(diagCritical)} trend="2 vs last month" sparkline="contracts-at-risk" />
            <KpiCard id="at-risk" label="At risk (score <60)" value={String(diagAtRisk)} trend="2 vs last month" sparkline="on-time-delivery" />
          </div>
        ),
      },
      { id: "field-engineers", span: 12, node: <PeopleWidget people={FIELD_ENGINEERS} title="Field engineers" /> },
      ...widgets.map((w): GridItem => ({ id: w.id, span: 4, tile: true, node: <CustomWidgetView config={w} /> })),
    ],
    [widgets]
  );

  if (tab !== "Overview") {
    return (
      <div className="flex flex-col gap-4">
        <DashboardTabs tabs={TABS} active={tab} onChange={setTab} />
        {tab === "Assets" && <AssetsTable />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DashboardTabs tabs={TABS} active={tab} onChange={setTab} />

      <DashboardGrid storageKey="diagnostics" items={gridItems} onAddWidget={() => setBuilding(true)} />

      {building && (
        <CustomWidgetBuilder
          onAdd={(config) => {
            setWidgets((ws) => [...ws, config]);
            setBuilding(false);
          }}
          onClose={() => setBuilding(false)}
        />
      )}
    </div>
  );
}
