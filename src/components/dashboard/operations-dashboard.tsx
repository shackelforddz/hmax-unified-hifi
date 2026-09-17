"use client";

import { useMemo, useState } from "react";
import KpiStrip from "@/components/dashboard/kpi-strip";
import ContractsAttention from "@/components/dashboard/operations/contracts-attention";
import FinancialPerformance from "@/components/dashboard/operations/financial-performance";
import ResourceCapacity from "@/components/dashboard/operations/resource-capacity";
import UpcomingServicing from "@/components/dashboard/upcoming-servicing";
import FleetMap from "@/components/dashboard/sales/fleet-map";
import DashboardTabs from "@/components/dashboard/dashboard-tabs";
import ContractsTable from "@/components/dashboard/tables/contracts-table";
import PeopleWidget from "@/components/dashboard/people-widget";
import { FIELD_ENGINEERS } from "@/lib/people-data";
import { PORTFOLIO_HEALTH as P } from "@/lib/operations-data";
import { OUTSTANDING } from "@/lib/kpi-detail";
import DashboardGrid, { type GridItem } from "@/components/dashboard/dashboard-grid";
import DeliveryTrend from "@/components/dashboard/delivery-trend";
import ResponseTime from "@/components/dashboard/operations/response-time";
import RevenueTiming from "@/components/dashboard/operations/revenue-timing";
import AssetsMonitored from "@/components/dashboard/operations/assets-monitored";
import CustomersTable from "@/components/dashboard/tables/customers-table";

const TABS = ["Overview", "Customers", "Contracts"];

export default function OperationsDashboard() {
  const [tab, setTab] = useState("Overview");

  // Draggable widgets, in their default order. Spans are out of 12.
  const gridItems: GridItem[] = useMemo(
    () => [
      {
        // The portfolio-health strip moves as one block.
        id: "portfolio-health",
        span: 12,
        node: (
          <KpiStrip
            kpis={[
              {
                id: "executed-margin",
                label: "Executed margin",
                value: P.executedMargin,
                trend: `${P.marginDelta} vs ${P.asSoldMargin} as-sold`,
                sparkline: "portfolio-margin",
                direction: "down",
              },
              {
                id: "revenue-vs-forecast",
                label: "Revenue vs forecast",
                value: P.revenue,
                trend: `${P.revenueDelta} vs ${P.revenueForecast} forecast`,
                sparkline: "revenue-mtd",
                direction: "down",
              },
              {
                id: "outstanding-payments",
                label: "Outstanding payments",
                value: OUTSTANDING.total,
                trend: OUTSTANDING.note,
                sparkline: "contracts-at-risk",
                direction: "flat",
              },
              {
                id: "resource-coverage",
                label: "Resource coverage",
                value: P.resourceCoverage,
                trend: P.resourceNote,
                sparkline: "active-contracts",
                direction: "flat",
              },
            ]}
          />
        ),
      },
      // ── Bento: where the work is and what's due next, then the money and
      //    delivery performance, then the contracts to act on ──
      { id: "fleet-map", span: 8, rows: 2, tile: true, node: <FleetMap mode="ops" /> },
      { id: "assets-monitored", span: 4, tile: true, node: <AssetsMonitored /> },
      { id: "upcoming-servicing", span: 4, tile: true, node: <UpcomingServicing /> },
      { id: "financial", span: 6, tile: true, node: <FinancialPerformance /> },
      { id: "revenue-timing", span: 6, tile: true, node: <RevenueTiming /> },
      { id: "delivery-trend", span: 4, tile: true, node: <DeliveryTrend /> },
      { id: "response-time", span: 4, tile: true, node: <ResponseTime /> },
      { id: "resource-capacity", span: 4, tile: true, node: <ResourceCapacity /> },
      { id: "contracts-attention", span: 12, node: <ContractsAttention /> },
      { id: "field-engineers", span: 12, node: <PeopleWidget people={FIELD_ENGINEERS} title="Field engineers" /> },
    ],
    []
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

      <DashboardGrid storageKey="operations" items={gridItems} />

    </div>
  );
}
