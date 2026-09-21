"use client";

import type { ReactNode } from "react";
import DeliveryTrend from "./delivery-trend";
import RevenueAtRisk from "./revenue-at-risk";
import WaitingOn from "./waiting-on";
import UpcomingServicing from "./upcoming-servicing";
import AttentionList from "./attention-list";
import PeopleWidget from "./people-widget";
import FinancialPerformance from "./operations/financial-performance";
import RevenueTiming from "./operations/revenue-timing";
import AssetsMonitored from "./operations/assets-monitored";
import ResponseTime from "./operations/response-time";
import ResourceCapacity from "./operations/resource-capacity";
import ContractsAttention from "./operations/contracts-attention";
import FleetHealth from "./sales/fleet-health";
import FleetMap from "./sales/fleet-map";
import { SALES_TEAM } from "@/lib/people-data";

export type WidgetCategory = "Commercial" | "Delivery" | "Assets" | "People";

export interface LibraryWidget {
  id: string;
  title: string;
  description: string;
  category: WidgetCategory;
  /** Columns out of 12 when dropped onto a dashboard. */
  span: number;
  render: () => ReactNode;
}

/* Every widget that can be dropped onto any dashboard. Each one reads its own
   data, so it renders the same wherever it lands. */
export const WIDGET_LIBRARY: LibraryWidget[] = [
  {
    id: "financial-performance",
    title: "Financial Performance",
    description: "Forecast margin, revenue and cost, with the margin trend behind them.",
    category: "Commercial",
    span: 8,
    render: () => <FinancialPerformance />,
  },
  {
    id: "revenue-timing",
    title: "Revenue & timing",
    description: "Invoiced against collected, month by month.",
    category: "Commercial",
    span: 4,
    render: () => <RevenueTiming />,
  },
  {
    id: "revenue-at-risk",
    title: "Revenue at risk",
    description: "What is putting revenue at risk, by trigger.",
    category: "Commercial",
    span: 4,
    render: () => <RevenueAtRisk />,
  },
  {
    id: "revenue-by-vendor",
    title: "Revenue at risk by vendor",
    description: "The same money by who we are exposed to, and on how many projects.",
    category: "Commercial",
    span: 4,
    render: () => <RevenueAtRisk by="vendor" />,
  },
  {
    id: "delivery-trend",
    title: "Delivery performance",
    description: "On-time delivery against target - click a point for the contracts behind it.",
    category: "Delivery",
    span: 8,
    render: () => <DeliveryTrend />,
  },
  {
    id: "response-time",
    title: "Response time",
    description: "First qualified response against the SLA, split by case priority.",
    category: "Delivery",
    span: 4,
    render: () => <ResponseTime />,
  },
  {
    id: "waiting-on",
    title: "Waiting on",
    description: "Open items owned by someone else that are holding contracts up.",
    category: "Delivery",
    span: 6,
    render: () => <WaitingOn />,
  },
  {
    id: "upcoming-servicing",
    title: "Upcoming servicing",
    description: "Scheduled maintenance visits across the portfolio, soonest first.",
    category: "Delivery",
    span: 6,
    render: () => <UpcomingServicing />,
  },
  {
    id: "contracts-attention",
    title: "Contracts needing attention",
    description: "The most pressing contract alerts, grouped by urgency.",
    category: "Delivery",
    span: 12,
    render: () => <ContractsAttention />,
  },
  {
    id: "attention-list",
    title: "Contracts that need your attention",
    description: "Your own contract alerts, filtered by type and customer.",
    category: "Delivery",
    span: 12,
    render: () => <AttentionList />,
  },
  {
    id: "assets-monitored",
    title: "Assets monitored",
    description: "Installed base under condition monitoring, split by health.",
    category: "Assets",
    span: 4,
    render: () => <AssetsMonitored />,
  },
  {
    id: "fleet-health",
    title: "Average Asset Health",
    description: "Average asset health against the standard over 30 days.",
    category: "Assets",
    span: 4,
    render: () => <FleetHealth />,
  },
  {
    id: "fleet-map",
    title: "Fleet map",
    description: "Where the fleet sits, with an alert ping on assets raising one.",
    category: "Assets",
    span: 8,
    render: () => <FleetMap />,
  },
  {
    id: "resource-capacity",
    title: "Resource & Capacity",
    description: "Team utilisation against headcount.",
    category: "People",
    span: 12,
    render: () => <ResourceCapacity />,
  },
  {
    id: "delivery-team",
    title: "Delivery team",
    description: "Who is on the delivery team, their load and what they are assigned.",
    category: "People",
    span: 12,
    render: () => <PeopleWidget title="Delivery team" />,
  },
  {
    id: "sales-team",
    title: "Sales team",
    description: "Who owns which leads and contracts on the sales side.",
    category: "People",
    span: 12,
    render: () => <PeopleWidget people={SALES_TEAM} title="Sales team" />,
  },
];

export const WIDGET_CATEGORIES: WidgetCategory[] = ["Commercial", "Delivery", "Assets", "People"];

export function libraryWidget(id: string): LibraryWidget | undefined {
  return WIDGET_LIBRARY.find((w) => w.id === id);
}
