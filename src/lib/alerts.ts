/* ── Alerts ──────────────────────────────────────────────────────────
   Every "needs attention" widget renders the same thing: a flat list of
   single alerts, each carrying its own customer and type, grouped under an
   urgency band. The source data is shaped differently per dashboard
   (contracts hold alerts, accounts hold flags, assets hold one alert), so
   each widget maps its records down to this one type and hands the result
   to <AlertsWidget />. */

import type { ContextEntity } from "@/components/dashboard/conversation-launcher";
import type { Playbook } from "@/lib/alert-playbooks";

export type AlertUrgency = "critical" | "at-risk" | "watch" | "proposed";

/** A meta field on the card footer. Only fields the source data actually
 *  has are included - nothing is invented to fill the row out. A field with
 *  no label renders as a bare value (some sources carry unlabelled notes). */
export interface AlertMetaItem {
  label?: string;
  value: string;
}

export interface AlertItem {
  id: string;
  /** First badge - the customer/account/asset the alert belongs to. */
  customer: string;
  /** Second badge, and the value the type filter matches on. */
  type: string;
  /** Optional second filter dimension, shown as its own select. */
  category?: string;
  urgency: AlertUrgency;
  title: string;
  detail: string;
  meta: AlertMetaItem[];
  /** The prompt the chat icon opens the conversation with. */
  action: string;
  entity: ContextEntity;
  playbook?: Playbook;
  /** Passed back through onOpenDetail when the eye icon is clicked. */
  detailId: string;
}

export const URGENCY_ORDER: AlertUrgency[] = ["critical", "at-risk", "watch", "proposed"];

export const URGENCY: Record<AlertUrgency, { label: string; dot: string; band: string }> = {
  critical: { label: "Critical", dot: "#fa000f", band: "bg-red-50" },
  "at-risk": { label: "At Risk", dot: "#f59e0b", band: "bg-amber-500/10" },
  watch: { label: "Watch", dot: "#a3a3a3", band: "bg-gray-100" },
  proposed: { label: "Proposed for you", dot: "#737373", band: "bg-gray-100" },
};

/** Alerts bucketed by urgency, in severity order, skipping empty buckets. */
export function groupByUrgency(alerts: AlertItem[]): [AlertUrgency, AlertItem[]][] {
  return URGENCY_ORDER.map((u) => [u, alerts.filter((a) => a.urgency === u)] as [AlertUrgency, AlertItem[]]).filter(
    ([, list]) => list.length > 0
  );
}

const URGENCY_RANK: Record<AlertUrgency, number> = { critical: 0, "at-risk": 1, watch: 2, proposed: 3 };

/** Trim a list down to the `limit` most pressing alerts. Takes the top alert
 *  from each entity before taking a second from any one of them, so a single
 *  noisy contract or account can't fill the whole widget on its own. */
export function topAlerts(all: AlertItem[], limit: number): AlertItem[] {
  if (all.length <= limit) return all;

  const byEntity = new Map<string, AlertItem[]>();
  for (const a of all) {
    const list = byEntity.get(a.detailId) ?? [];
    list.push(a);
    byEntity.set(a.detailId, list);
  }
  // Most severe entity first, so the round-robin starts where it matters.
  const queues = [...byEntity.values()].sort((a, b) => URGENCY_RANK[a[0].urgency] - URGENCY_RANK[b[0].urgency]);

  const out: AlertItem[] = [];
  for (let round = 0; out.length < limit; round++) {
    const before = out.length;
    for (const q of queues) {
      if (out.length === limit) break;
      if (q[round]) out.push(q[round]);
    }
    if (out.length === before) break; // every queue exhausted
  }
  // Keep the caller's original ordering within the surviving set.
  return all.filter((a) => out.includes(a));
}

/** Type filter options in first-seen order. */
export function typesOf(alerts: AlertItem[]): string[] {
  return [...new Set(alerts.map((a) => a.type))];
}

/** Category filter options in first-seen order; empty when none are set. */
export function categoriesOf(alerts: AlertItem[]): string[] {
  return [...new Set(alerts.map((a) => a.category).filter((c): c is string => !!c))];
}

/** Customer filter options, alphabetical. */
export function customersOf(alerts: AlertItem[]): string[] {
  return [...new Set(alerts.map((a) => a.customer))].sort((a, b) => a.localeCompare(b));
}

const VALUE_RE = /^[€$£]/;
const OWNER_RE = /^[A-Z][a-zA-Z'-]+ [A-Z]\.?$/;

/** Several records carry their meta as one display string ("Jan V. · €4.2M ·
 *  Margin Risk"). Split it and label the segments we can recognise; the rest
 *  ride along unlabelled rather than being dropped or given a made-up label. */
export function parseMetaString(meta: string): AlertMetaItem[] {
  return meta
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) => {
      if (VALUE_RE.test(part)) return { label: "Value", value: part };
      if (OWNER_RE.test(part)) return { label: "Owner", value: part };
      return { value: part };
    });
}

/** Insert the alert's Impact into a meta row, just after Value where there is
 *  one (the order the design uses), otherwise at the front. */
export function withImpact(meta: AlertMetaItem[], impact?: string): AlertMetaItem[] {
  if (!impact) return meta;
  const entry: AlertMetaItem = { label: "Impact", value: impact };
  const valueAt = meta.findIndex((m) => m.label === "Value");
  const at = valueAt === -1 ? 0 : valueAt + 1;
  return [...meta.slice(0, at), entry, ...meta.slice(at)];
}
