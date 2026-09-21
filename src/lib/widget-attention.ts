/* ── Widgets that need attention ──────────────────────────────────────
   A widget turns red when its own measure has actually breached - not
   because its subject sounds serious. Each flag is the comparison a reader
   would make themselves, so nothing is flagged by hand.

   The alert lists and the people widgets are deliberately absent: an alert
   list already carries an urgency band per row, and a person is not a
   threshold. */

import { DELIVERY_TREND, REVENUE_AT_RISK } from "@/lib/dashboard-data";
import { FINANCIALS, RESPONSE_TIME, TEAMS } from "@/lib/operations-data";
import { FLEET_HEALTH } from "@/lib/sales-data";

const num = (v: string) => parseFloat(v.replace(/[^0-9.]/g, "")) || 0;

/** The standard asset health is measured against, from the latest reading. */
const HEALTH_STANDARD = FLEET_HEALTH.points.at(-1)?.std ?? 80;

/** A team this close to full has no slack left for anything unplanned. */
const UTILISATION_LIMIT = 95;

/** What breached, and by how much - the text behind a widget's alert icon. */
export interface WidgetAlertCopy {
  title: string;
  detail: string;
  /** The widget this belongs to, used as the conversation's context. */
  widget: string;
  /** What HMAX recommends doing about it. */
  action: { label: string; prompt: string };
}

export const ATTENTION_DETAIL: Record<string, WidgetAlertCopy> = {
  deliveryTrend: {
    title: "Under target",
    widget: "Delivery performance",
    action: {
      label: "Find what is slipping",
      prompt: "Which contracts are pulling on-time delivery under target?",
    },
    detail: `On-time delivery is ${DELIVERY_TREND.current} against an ${DELIVERY_TREND.target}% target - ${Math.round(
      DELIVERY_TREND.target - num(DELIVERY_TREND.current)
    )}pp short, and down ${DELIVERY_TREND.delta}.`,
  },
  revenueAtRisk: {
    title: "Revenue at risk",
    widget: "Revenue at risk",
    action: {
      label: "Work the biggest exposure",
      prompt: "What is putting revenue at risk this quarter, and which should I work first?",
    },
    detail: `${REVENUE_AT_RISK.total} of revenue is at risk this quarter. ${REVENUE_AT_RISK.bars[0].display} of it sits behind ${REVENUE_AT_RISK.bars[0].label.toLowerCase()}.`,
  },
  financial: {
    title: "Margin behind plan",
    widget: "Financial Performance",
    action: {
      label: "Trace the gap",
      prompt: "Where is the margin gap against plan coming from?",
    },
    detail: `Executed margin is ${FINANCIALS.forecastMargin}, ${FINANCIALS.marginVsPlan.replace("-", "")} behind the ${FINANCIALS.planMargin}% plan.`,
  },
  resourceCapacity: {
    title: "No slack left",
    widget: "Resource & Capacity",
    action: {
      label: "Cover the constraint",
      prompt: "How do we cover Field Service without putting on-time delivery at risk?",
    },
    detail: (() => {
      const over = TEAMS.filter((t) => t.utilization >= UTILISATION_LIMIT);
      return `${over.map((t) => `${t.name} is at ${t.utilization}%`).join(", ")} - ${
        over.length === 1 ? "that team has" : "those teams have"
      } no capacity for anything unplanned.`;
    })(),
  },
  fleetHealth: {
    title: "Below standard",
    widget: "Average Asset Health",
    action: {
      label: "See what is declining",
      prompt: "Which assets are pulling average health below the standard?",
    },
    detail: `Average asset health is ${FLEET_HEALTH.today} against a standard of ${HEALTH_STANDARD}, down ${Math.abs(
      FLEET_HEALTH.change
    )} over 30 days.`,
  },
};

export const NEEDS_ATTENTION = {
  /** On-time delivery under its target. */
  deliveryTrend: num(DELIVERY_TREND.current) < DELIVERY_TREND.target,
  /** Any revenue at risk at all is worth reading. */
  revenueAtRisk: num(REVENUE_AT_RISK.total) > 0,
  /** Executed margin behind plan. */
  financial: FINANCIALS.marginVsPlan.trim().startsWith("-"),
  /** A team at or over the utilisation limit. */
  resourceCapacity: TEAMS.some((t) => t.utilization >= UTILISATION_LIMIT),
  /** Average asset health below the standard. */
  fleetHealth: FLEET_HEALTH.today < HEALTH_STANDARD,
  /** Response time over target - currently inside it, so this reads false. */
  responseTime: num(RESPONSE_TIME.current) > RESPONSE_TIME.target,
};
