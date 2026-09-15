"use client";

import { useMemo, useState } from "react";
import MetricCard from "@/components/dashboard/operations/metric-card";
import ContractsAttention from "@/components/dashboard/operations/contracts-attention";
import FinancialPerformance from "@/components/dashboard/operations/financial-performance";
import ResourceCapacity from "@/components/dashboard/operations/resource-capacity";
import CustomWidgetView from "@/components/dashboard/sales/custom-widget-view";
import CustomWidgetBuilder from "@/components/dashboard/sales/custom-widget-builder";
import { type CustomWidgetConfig } from "@/lib/custom-widget";
import DashboardTabs from "@/components/dashboard/dashboard-tabs";
import ContractsTable from "@/components/dashboard/tables/contracts-table";
import PeopleWidget from "@/components/dashboard/people-widget";
import { FIELD_ENGINEERS } from "@/lib/people-data";
import { PORTFOLIO_HEALTH as P } from "@/lib/operations-data";
import DashboardGrid, { type GridItem } from "@/components/dashboard/dashboard-grid";
import DeliveryTrend from "@/components/dashboard/delivery-trend";
import ResponseTime from "@/components/dashboard/operations/response-time";
import RevenueTiming from "@/components/dashboard/operations/revenue-timing";
import AssetsMonitored from "@/components/dashboard/operations/assets-monitored";
import CustomersTable from "@/components/dashboard/tables/customers-table";

const TABS = ["Overview", "Customers", "Contracts"];

export default function OperationsDashboard() {
  const [widgets, setWidgets] = useState<CustomWidgetConfig[]>([]);
  const [building, setBuilding] = useState(false);
  const [tab, setTab] = useState("Overview");

  // Draggable widgets, in their default order. Spans are out of 12.
  const gridItems: GridItem[] = useMemo(
    () => [
      {
        // The portfolio-health strip moves as one block.
        id: "portfolio-health",
        span: 12,
        node: (
          <div className="grid grid-cols-4 gap-4 h-full">
            <MetricCard label="Executed vs as-sold margin" value={P.executedMargin} delta={P.marginDelta} note={`vs ${P.asSoldMargin} as-sold`} />
            <MetricCard label="Revenue vs forecast" value={P.revenue} delta={P.revenueDelta} note={`vs ${P.revenueForecast} forecast`} />
            <MetricCard label="Outstanding payments" value={P.outstandingPayments} note={P.outstandingNote} />
            <MetricCard label="Resource coverage" value={P.resourceCoverage} note={P.resourceNote} />
          </div>
        ),
      },
      // ── Bento: margin anchors the left, delivery + response stack beside
      //    it, and the three supporting visuals run along the bottom ──
      { id: "financial", span: 6, rows: 2, tile: true, node: <FinancialPerformance /> },
      { id: "delivery-trend", span: 6, tile: true, node: <DeliveryTrend /> },
      { id: "response-time", span: 6, tile: true, node: <ResponseTime /> },
      { id: "revenue-timing", span: 4, tile: true, node: <RevenueTiming /> },
      { id: "assets-monitored", span: 4, tile: true, node: <AssetsMonitored /> },
      { id: "resource-capacity", span: 4, tile: true, node: <ResourceCapacity /> },
      { id: "contracts-attention", span: 12, node: <ContractsAttention /> },
      { id: "field-engineers", span: 12, node: <PeopleWidget people={FIELD_ENGINEERS} title="Field engineers" /> },
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
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DashboardTabs tabs={TABS} active={tab} onChange={setTab} />

      <DashboardGrid storageKey="operations" items={gridItems} onAddWidget={() => setBuilding(true)} />

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
