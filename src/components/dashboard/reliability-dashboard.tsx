"use client";

import { useMemo, useState } from "react";
import KpiCard from "@/components/dashboard/kpi-card";
import FleetMap from "@/components/dashboard/sales/fleet-map";
import FleetHealth from "@/components/dashboard/sales/fleet-health";
import AssetAlerts from "@/components/dashboard/sales/asset-alerts";
import ScopeReviews from "@/components/dashboard/reliability/scope-reviews";
import { ASSET_REVIEW_ALERTS, REVIEW_CATEGORY_OPTIONS } from "@/lib/reliability-data";
import DashboardTabs from "@/components/dashboard/dashboard-tabs";
import ContractsTable from "@/components/dashboard/tables/contracts-table";
import AssetsTable from "@/components/dashboard/tables/assets-table";
import DashboardGrid, { type GridItem } from "@/components/dashboard/dashboard-grid";
import CustomersTable from "@/components/dashboard/tables/customers-table";

const TABS = ["Overview", "Customers", "Contracts", "Assets"];

// Asset-health KPIs lead this view - counted from the "Assets to review" list below.
const relCritical = ASSET_REVIEW_ALERTS.filter((a) => a.status === "critical").length;
const relAtRisk = ASSET_REVIEW_ALERTS.filter((a) => a.status === "at-risk").length;
const HEALTH_KPIS = [
  { id: "critical-assets", label: "Critical assets", value: String(relCritical), trend: "2 vs last month", sparkline: "contracts-at-risk" as const },
  { id: "at-risk", label: "At risk (score <60)", value: String(relAtRisk), trend: "2 vs last month", sparkline: "on-time-delivery" as const },
  { id: "overdue-insp", label: "Overdue inspections", value: "5", trend: "1 vs last month", sparkline: "portfolio-margin" as const },
];

export default function ReliabilityDashboard() {
  const [tab, setTab] = useState("Overview");

  // Draggable widgets, in their default order. Spans are out of 12.
  const gridItems: GridItem[] = useMemo(
    () => [
      {
        // The health KPI strip moves as one block.
        id: "kpis",
        span: 12,
        node: (
          <div className="grid grid-cols-3 gap-4 h-full">
            {HEALTH_KPIS.map((k) => (
              <KpiCard key={k.id} {...k} />
            ))}
          </div>
        ),
      },
      { id: "fleet-map", span: 8, tile: true, node: <FleetMap /> },
      { id: "fleet-health", span: 4, tile: true, node: <FleetHealth /> },
      {
        id: "assets-to-review",
        span: 12,
        node: <AssetAlerts alerts={ASSET_REVIEW_ALERTS} categoryOptions={REVIEW_CATEGORY_OPTIONS} title="Assets to review" />,
      },
      { id: "scope-reviews", span: 12, node: <ScopeReviews /> },
    ],
    []
  );

  if (tab !== "Overview") {
    return (
      <div className="flex flex-col gap-4">
        <DashboardTabs tabs={TABS} active={tab} onChange={setTab} />
        {tab === "Customers" && <CustomersTable />}
        {tab === "Assets" && <AssetsTable />}
        {tab === "Contracts" && <ContractsTable />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DashboardTabs tabs={TABS} active={tab} onChange={setTab} />

      <DashboardGrid storageKey="reliability" items={gridItems} />

    </div>
  );
}
