"use client";

import { useMemo, useState } from "react";
import KpiCard from "@/components/dashboard/kpi-card";
import AttentionList from "@/components/dashboard/attention-list";
import DeliveryTrend from "@/components/dashboard/delivery-trend";
import RevenueAtRisk from "@/components/dashboard/revenue-at-risk";
import UpcomingServicing from "@/components/dashboard/upcoming-servicing";
import VendorConcentration from "@/components/dashboard/vendor-concentration";
import WaitingOn from "@/components/dashboard/waiting-on";
import CustomWidgetView from "@/components/dashboard/sales/custom-widget-view";
import CustomWidgetBuilder from "@/components/dashboard/sales/custom-widget-builder";
import { KPI_DATA } from "@/lib/dashboard-data";
import { type CustomWidgetConfig } from "@/lib/custom-widget";
import DashboardTabs from "@/components/dashboard/dashboard-tabs";
import ContractsTable from "@/components/dashboard/tables/contracts-table";
import AssetsTable from "@/components/dashboard/tables/assets-table";
import PeopleWidget from "@/components/dashboard/people-widget";
import DashboardGrid, { type GridItem } from "@/components/dashboard/dashboard-grid";
import CustomersTable from "@/components/dashboard/tables/customers-table";

const TABS = ["Overview", "Customers", "Contracts", "Assets"];

export default function PmDashboard() {
  const [widgets, setWidgets] = useState<CustomWidgetConfig[]>([]);
  const [building, setBuilding] = useState(false);
  const [tab, setTab] = useState("Overview");

  // Draggable widgets, in their default order. Spans are out of 12.
  const gridItems: GridItem[] = useMemo(
    () => [
      {
        // The KPI strip moves as one block - the cards inside it don't reorder.
        id: "kpis",
        span: 12,
        node: (
          <div className="grid grid-cols-4 gap-4 h-full">
            {KPI_DATA.map((kpi) => (
              <KpiCard key={kpi.id} {...kpi} />
            ))}
          </div>
        ),
      },
      // ── Bento: delivery leads wide, then three supporting tiles ──
      { id: "delivery-trend", span: 8, tile: true, node: <DeliveryTrend /> },
      { id: "revenue-at-risk", span: 4, tile: true, node: <RevenueAtRisk /> },
      { id: "waiting-on", span: 4, tile: true, node: <WaitingOn /> },
      { id: "servicing", span: 4, tile: true, node: <UpcomingServicing /> },
      { id: "vendors", span: 4, tile: true, node: <VendorConcentration /> },
      { id: "attention", span: 12, node: <AttentionList /> },
      { id: "people", span: 12, node: <PeopleWidget /> },
      ...widgets.map((w): GridItem => ({ id: w.id, span: 6, tile: true, node: <CustomWidgetView config={w} /> })),
    ],
    [widgets]
  );

  if (tab !== "Overview") {
    return (
      <div className="flex flex-col gap-4">
        <DashboardTabs tabs={TABS} active={tab} onChange={setTab} />
        {tab === "Customers" && <CustomersTable />}
        {tab === "Contracts" && <ContractsTable />}
        {tab === "Assets" && <AssetsTable />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DashboardTabs tabs={TABS} active={tab} onChange={setTab} />

      <DashboardGrid storageKey="pm" items={gridItems} onAddWidget={() => setBuilding(true)} />

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
