"use client";

import { useMemo, useState } from "react";
import KpiCard from "@/components/dashboard/kpi-card";
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
          <div className="grid grid-cols-4 gap-4 h-full">
            <KpiCard
              id="executed-margin"
              label="Executed margin"
              value={P.executedMargin}
              trend={`${P.marginDelta} vs ${P.asSoldMargin} as-sold`}
              sparkline="portfolio-margin"
              direction="down"
            />
            <KpiCard
              id="revenue-vs-forecast"
              label="Revenue vs forecast"
              value={P.revenue}
              trend={`${P.revenueDelta} vs ${P.revenueForecast} forecast`}
              sparkline="revenue-mtd"
              direction="down"
            />
            <KpiCard
              id="outstanding-payments"
              label="Outstanding payments"
              value={P.outstandingPayments}
              trend={P.outstandingNote}
              sparkline="contracts-at-risk"
              direction="flat"
            />
            <KpiCard
              id="resource-coverage"
              label="Resource coverage"
              value={P.resourceCoverage}
              trend={P.resourceNote}
              sparkline="active-contracts"
              direction="flat"
            />
          </div>
        ),
      },
      // ── Bento: each row answers one question - the money, the fleet, how
      //    operations is running, then what is due next ──
      { id: "financial", span: 8, tile: true, node: <FinancialPerformance /> },
      { id: "revenue-timing", span: 4, tile: true, node: <RevenueTiming /> },
      { id: "fleet-map", span: 8, tile: true, node: <FleetMap /> },
      { id: "assets-monitored", span: 4, tile: true, node: <AssetsMonitored /> },
      { id: "delivery-trend", span: 6, tile: true, node: <DeliveryTrend /> },
      { id: "response-time", span: 6, tile: true, node: <ResponseTime /> },
      { id: "resource-capacity", span: 6, tile: true, node: <ResourceCapacity /> },
      { id: "upcoming-servicing", span: 6, tile: true, node: <UpcomingServicing /> },
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
