"use client";

import { useMemo, useState } from "react";
import FleetMap from "@/components/dashboard/sales/fleet-map";
import FleetHealth from "@/components/dashboard/sales/fleet-health";
import AssetAlerts from "@/components/dashboard/sales/asset-alerts";
import OpportunityStats from "@/components/dashboard/sales/opportunity-stats";
import Opportunities from "@/components/dashboard/sales/opportunities";
import DashboardTabs from "@/components/dashboard/dashboard-tabs";
import DetailPage, { pageTabFor } from "@/components/dashboard/detail-page";
import { useDetailDrawers } from "@/components/dashboard/detail-drawers";
import OpportunitiesTable from "@/components/dashboard/tables/opportunities-table";
import ContractsTable from "@/components/dashboard/tables/contracts-table";
import AssetsTable from "@/components/dashboard/tables/assets-table";
import DashboardGrid, { type GridItem } from "@/components/dashboard/dashboard-grid";
import PeopleWidget from "@/components/dashboard/people-widget";
import { SALES_TEAM } from "@/lib/people-data";
import CustomersTable from "@/components/dashboard/tables/customers-table";
import FinancialPerformance from "@/components/dashboard/operations/financial-performance";
import RevenueTiming from "@/components/dashboard/operations/revenue-timing";
import AssetsMonitored from "@/components/dashboard/operations/assets-monitored";

const TABS = ["Overview", "Leads", "Customers", "Contracts", "Assets"];

export default function SalesDashboard() {
  const [tab, setTab] = useState("Overview");
  const drawers = useDetailDrawers();
  const page = drawers?.page;
  const pageTab = pageTabFor(page, TABS);
  const change = (next: string) => {
    drawers?.closePage();
    setTab(next);
  };

  // Draggable widgets, in their default order. Spans are out of 12.
  const gridItems: GridItem[] = useMemo(
    () => [
      { id: "lead-stats", span: 12, node: <OpportunityStats /> },
      // ── Bento: the fleet leads, then the commercial tiles ──
      { id: "fleet-map", span: 8, tile: true, node: <FleetMap mode="sales" /> },
      { id: "fleet-health", span: 4, tile: true, node: <FleetHealth /> },
      { id: "financial", span: 4, tile: true, node: <FinancialPerformance /> },
      { id: "revenue-timing", span: 4, tile: true, node: <RevenueTiming /> },
      { id: "assets-monitored", span: 4, tile: true, node: <AssetsMonitored /> },
      { id: "renewals", span: 12, node: <Opportunities category="Renewal" title="Renewals that need your attention" withContext /> },
      { id: "new-leads", span: 12, node: <Opportunities category="New lead" title="New leads that need your attention" withProposals /> },
      { id: "sales-team", span: 12, node: <PeopleWidget people={SALES_TEAM} title="Sales team" /> },
      { id: "asset-alerts", span: 12, node: <AssetAlerts /> },
    ],
    []
  );

  // A record opened as a page takes over the tab it belongs to.
  if (page && pageTab) {
    return (
      <div className="flex flex-col gap-4">
        <DashboardTabs tabs={TABS} active={pageTab} onChange={change} />
        <DetailPage detail={page} backLabel={pageTab} />
      </div>
    );
  }

  if (tab !== "Overview") {
    return (
      <div className="flex flex-col gap-4">
        <DashboardTabs tabs={TABS} active={tab} onChange={change} />
        {tab === "Leads" && <OpportunitiesTable />}
        {tab === "Customers" && <CustomersTable />}
        {tab === "Contracts" && <ContractsTable />}
        {tab === "Assets" && <AssetsTable />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DashboardTabs tabs={TABS} active={tab} onChange={change} />

      <DashboardGrid storageKey="sales" items={gridItems} />

    </div>
  );
}
