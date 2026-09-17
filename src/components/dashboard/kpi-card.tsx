"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import Sparkline from "./sparkline";
import WidgetChat from "./widget-chat";
import { kpiDetail } from "@/lib/kpi-detail";
import type { KpiData } from "@/lib/dashboard-data";

interface Props extends KpiData {
  /** This KPI's records are the ones expanded below the strip. */
  selected?: boolean;
  /** Omitted when the card has no records to show. */
  onToggle?: () => void;
}

export default function KpiCard({ id, label, value, trend, sparkline, direction = "down", selected, onToggle }: Props) {
  const Arrow = direction === "up" ? ArrowUp : ArrowDown;
  const expandable = !!kpiDetail(id) && !!onToggle;

  return (
    <div
      // A div, not a button: the widget-chat trigger inside is a button, and
      // buttons can't nest.
      role={expandable ? "button" : undefined}
      tabIndex={expandable ? 0 : undefined}
      aria-expanded={expandable ? !!selected : undefined}
      aria-label={expandable ? `${label} - show the records behind it` : undefined}
      onClick={
        expandable
          ? (e) => {
              // Leave the chat trigger alone.
              if ((e.target as HTMLElement).closest("button")) return;
              onToggle!();
            }
          : undefined
      }
      onKeyDown={
        expandable
          ? (e) => {
              if (e.target !== e.currentTarget) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggle!();
              }
            }
          : undefined
      }
      className={`relative bg-white rounded-xl border p-4 flex flex-col gap-3 transition-colors ${
        expandable ? "cursor-pointer" : ""
      } ${selected ? "border-gray-900" : "border-gray-200"} ${expandable && !selected ? "hover:border-gray-400" : ""}`}
    >
      {/* Label row */}
      <div className="flex items-start justify-between">
        <span className="text-base font-bold text-gray-900 leading-snug">{label}</span>
        <WidgetChat title={label} />
      </div>

      {/* Value + trend + sparkline */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900 leading-none mb-2">{value}</div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            {direction !== "flat" && <Arrow size={11} strokeWidth={2} />}
            <span>{trend}</span>
          </div>
        </div>
        <Sparkline variant={sparkline} />
      </div>
    </div>
  );
}
