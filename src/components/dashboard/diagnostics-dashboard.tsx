"use client";

import { useMemo, useState } from "react";
import KpiCard from "@/components/dashboard/kpi-card";
import FleetMap from "@/components/dashboard/sales/fleet-map";
import FleetHealth from "@/components/dashboard/sales/fleet-health";
import AssetAlerts from "@/components/dashboard/sales/asset-alerts";
import AssetsMonitored from "@/components/dashboard/operations/assets-monitored";
import PeopleWidget from "@/components/dashboard/people-widget";
import { FIELD_ENGINEERS } from "@/lib/people-data";
import DashboardTabs from "@/components/dashboard/dashboard-tabs";
import AssetsTable from "@/components/dashboard/tables/assets-table";
import { DIAGNOSTICS_STATS, ASSET_REPORT_ALERTS, REPORT_CATEGORY_OPTIONS } from "@/lib/field-reports-data";
import { lowDgaAssets } from "@/lib/sales-data";
import DashboardGrid, { type GridItem } from "@/components/dashboard/dashboard-grid";

const TABS = ["Overview", "Assets"];

// Assets whose oil is scoring below the DGA threshold - the diagnostics
// engineer's own measure, not a field-report flag.
const lowDga = lowDgaAssets().length;

const KPIS = [
  { id: "reports-awaiting", label: "Reports awaiting interpretation", value: String(ASSET_REPORT_ALERTS.length), trend: "2 vs last week", sparkline: "contracts-at-risk" as const },
  { id: "outstanding-reports", label: "Outstanding reports", value: String(DIAGNOSTICS_STATS.outstandingReports), trend: "3 vs last week", sparkline: "active-contracts" as const },
  { id: "low-dga", label: "Assets with low DGA", value: String(lowDga), trend: "1 vs last month", sparkline: "portfolio-margin" as const },
];

export default function DiagnosticsDashboard() {
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
      // ── Bento: the map leads, with average asset health and coverage stacked
      //    beside it, then the reports to interpret ──
      { id: "fleet-map", span: 8, rows: 2, tile: true, node: <FleetMap mode="alerts" alerts={ASSET_REPORT_ALERTS} categoryOptions={REPORT_CATEGORY_OPTIONS} /> },
      { id: "fleet-health", span: 4, tile: true, node: <FleetHealth /> },
      { id: "assets-monitored", span: 4, tile: true, node: <AssetsMonitored /> },
      {
        id: "reports-to-review",
        span: 12,
        node: <AssetAlerts alerts={ASSET_REPORT_ALERTS} categoryOptions={REPORT_CATEGORY_OPTIONS} title="Asset reports to review" showDgaScore faultsLead={false} />,
      },
      { id: "field-engineers", span: 12, node: <PeopleWidget people={FIELD_ENGINEERS} title="Field engineers" /> },
    ],
    []
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

      <DashboardGrid storageKey="diagnostics" items={gridItems} />

    </div>
  );
}
