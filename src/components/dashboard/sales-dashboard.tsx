"use client";

import { useMemo, useState } from "react";
import KpiCard from "@/components/dashboard/kpi-card";
import FleetMap from "@/components/dashboard/sales/fleet-map";
import FleetHealth from "@/components/dashboard/sales/fleet-health";
import AssetAlerts from "@/components/dashboard/sales/asset-alerts";
import OpportunityStats from "@/components/dashboard/sales/opportunity-stats";
import Opportunities from "@/components/dashboard/sales/opportunities";
import CustomWidgetView from "@/components/dashboard/sales/custom-widget-view";
import CustomWidgetBuilder from "@/components/dashboard/sales/custom-widget-builder";
import { type CustomWidgetConfig } from "@/lib/custom-widget";
import DashboardTabs from "@/components/dashboard/dashboard-tabs";
import OpportunitiesTable from "@/components/dashboard/tables/opportunities-table";
import ContractsTable from "@/components/dashboard/tables/contracts-table";
import AssetsTable from "@/components/dashboard/tables/assets-table";
import { ASSET_ALERTS } from "@/lib/sales-data";
import DashboardGrid, { type GridItem } from "@/components/dashboard/dashboard-grid";
import PeopleWidget from "@/components/dashboard/people-widget";
import { SALES_TEAM } from "@/lib/people-data";
import CustomersTable from "@/components/dashboard/tables/customers-table";

const TABS = ["Overview", "Leads", "Customers", "Contracts", "Assets"];

// Asset-health KPIs are counted from the same alert list the widget shows below.
const criticalAssets = ASSET_ALERTS.filter((a) => a.status === "critical").length;
const atRiskAssets = ASSET_ALERTS.filter((a) => a.status === "at-risk").length;

export default function SalesDashboard() {
  const [widgets, setWidgets] = useState<CustomWidgetConfig[]>([]);
  const [building, setBuilding] = useState(false);
  const [tab, setTab] = useState("Overview");

  // Draggable widgets, in their default order. Spans are out of 12.
  const gridItems: GridItem[] = useMemo(
    () => [
      { id: "lead-stats", span: 12, node: <OpportunityStats /> },
      { id: "renewals", span: 12, node: <Opportunities category="Renewal" title="Renewals that need your attention" withContext /> },
      { id: "new-leads", span: 12, node: <Opportunities category="New lead" title="New leads that need your attention" withProposals /> },
      { id: "sales-team", span: 12, node: <PeopleWidget people={SALES_TEAM} title="Sales team" /> },
      // ── Assets: fleet on top, then the alert list ──
      { id: "fleet-map", span: 8, tile: true, node: <FleetMap /> },
      {
        id: "fleet-health",
        span: 4,
        node: (
          <div className="flex flex-col gap-4">
            <FleetHealth />
            <KpiCard id="critical-assets" label="Critical assets" value={String(criticalAssets)} trend="2 vs last month" sparkline="contracts-at-risk" />
            <KpiCard id="at-risk" label="At risk (score <60)" value={String(atRiskAssets)} trend="2 vs last month" sparkline="on-time-delivery" />
          </div>
        ),
      },
      { id: "asset-alerts", span: 12, node: <AssetAlerts /> },
      ...widgets.map((w): GridItem => ({ id: w.id, span: 4, tile: true, node: <CustomWidgetView config={w} /> })),
    ],
    [widgets]
  );

  if (tab !== "Overview") {
    return (
      <div className="flex flex-col gap-4">
        <DashboardTabs tabs={TABS} active={tab} onChange={setTab} />
        {tab === "Leads" && <OpportunitiesTable />}
        {tab === "Customers" && <CustomersTable />}
        {tab === "Contracts" && <ContractsTable />}
        {tab === "Assets" && <AssetsTable />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DashboardTabs tabs={TABS} active={tab} onChange={setTab} />

      <DashboardGrid storageKey="sales" items={gridItems} onAddWidget={() => setBuilding(true)} />

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
