"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import Sparkline from "./sparkline";
import WidgetChat from "./widget-chat";
import KpiPanel from "./kpi-panel";
import { kpiDetail } from "@/lib/kpi-detail";
import type { KpiData } from "@/lib/dashboard-data";

export default function KpiCard({ id, label, value, trend, sparkline, direction = "down" }: KpiData) {
  const Arrow = direction === "up" ? ArrowUp : ArrowDown;
  const detail = kpiDetail(id);

  // Clicking the card lists the records behind the number.
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Closing: a click anywhere else, or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Only the panel closes - a drawer opened from a row handles its own.
      e.stopImmediatePropagation();
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const toggle = () => setOpen((o) => !o);

  return (
    <div
      ref={cardRef}
      // A div, not a button: the widget-chat trigger and the panel's own rows
      // are buttons, and buttons can't nest.
      role={detail ? "button" : undefined}
      tabIndex={detail ? 0 : undefined}
      aria-expanded={detail ? open : undefined}
      aria-label={detail ? `${label} - show the ${detail.caption.toLowerCase()}` : undefined}
      onClick={
        detail
          ? (e) => {
              // Leave the chat trigger and anything inside the panel alone.
              if ((e.target as HTMLElement).closest("button, [data-kpi-panel]")) return;
              toggle();
            }
          : undefined
      }
      onKeyDown={
        detail
          ? (e) => {
              if (e.target !== e.currentTarget) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle();
              }
            }
          : undefined
      }
      className={`relative bg-white rounded-xl border p-4 flex flex-col gap-3 transition-colors ${
        detail ? "cursor-pointer" : ""
      } ${open ? "border-gray-400" : "border-gray-200"} ${detail && !open ? "hover:border-gray-400" : ""}`}
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

      {detail && open && <KpiPanel label={label} value={value} detail={detail} onClose={() => setOpen(false)} />}
    </div>
  );
}
