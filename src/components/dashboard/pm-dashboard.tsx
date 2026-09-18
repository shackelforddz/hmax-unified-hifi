"use client";

import { useMemo, useState } from "react";
import KpiStrip from "@/components/dashboard/kpi-strip";
import AttentionList from "@/components/dashboard/attention-list";
import DeliveryTrend from "@/components/dashboard/delivery-trend";
import RevenueAtRisk from "@/components/dashboard/revenue-at-risk";
import UpcomingServicing from "@/components/dashboard/upcoming-servicing";
import WaitingOn from "@/components/dashboard/waiting-on";
import PmRiskMap from "@/components/dashboard/pm-risk-map";
import { KPI_DATA } from "@/lib/dashboard-data";
import DashboardTabs from "@/components/dashboard/dashboard-tabs";
import DetailPage, { pageTabFor } from "@/components/dashboard/detail-page";
import { useDetailDrawers } from "@/components/dashboard/detail-drawers";
import ContractsTable from "@/components/dashboard/tables/contracts-table";
import AssetsTable from "@/components/dashboard/tables/assets-table";
import PeopleWidget from "@/components/dashboard/people-widget";
import DashboardGrid, { type GridItem } from "@/components/dashboard/dashboard-grid";
import CustomersTable from "@/components/dashboard/tables/customers-table";

const TABS = ["Overview", "Customers", "Contracts", "Assets"];

export default function PmDashboard() {
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
      {
        // The KPI strip moves as one block - the cards inside it don't reorder.
        id: "kpis",
        span: 12,
        node: <KpiStrip kpis={KPI_DATA} />,
      },
      // ── Bento: where delivery is at risk and what's due, then how delivery
      //    is trending and who we're waiting on ──
      { id: "delivery-map", span: 8, rows: 2, tile: true, node: <PmRiskMap /> },
      { id: "revenue-at-risk", span: 4, tile: true, node: <RevenueAtRisk /> },
      { id: "servicing", span: 4, tile: true, node: <UpcomingServicing /> },
      { id: "delivery-trend", span: 6, tile: true, node: <DeliveryTrend /> },
      { id: "waiting-on", span: 6, tile: true, node: <WaitingOn /> },
      { id: "attention", span: 12, node: <AttentionList /> },
      { id: "people", span: 12, node: <PeopleWidget /> },
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
        {tab === "Customers" && <CustomersTable />}
        {tab === "Contracts" && <ContractsTable />}
        {tab === "Assets" && <AssetsTable />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DashboardTabs tabs={TABS} active={tab} onChange={change} />

      <DashboardGrid storageKey="pm" items={gridItems} />

    </div>
  );
}
