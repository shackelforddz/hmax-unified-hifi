"use client";

import { useRef } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import Sparkline from "./sparkline";
import WidgetChat from "./widget-chat";
import { kpiDetail } from "@/lib/kpi-detail";
import type { KpiData } from "@/lib/dashboard-data";
import { DUR, EASE, STAGGER, dur, formatNumeric, gsap, parseNumeric, prefersReducedMotion, useGSAP } from "@/lib/motion";

interface Props extends KpiData {
  /** This KPI's records are the ones expanded below the strip. */
  selected?: boolean;
  /** Omitted when the card has no records to show. */
  onToggle?: () => void;
  /** Position in the strip, so the cards arrive across it rather than at once. */
  index?: number;
}

export default function KpiCard({ id, label, value, trend, sparkline, direction = "down", selected, onToggle, index = 0 }: Props) {
  const Arrow = direction === "up" ? ArrowUp : ArrowDown;
  const expandable = !!kpiDetail(id) && !!onToggle;
  const card = useRef<HTMLDivElement>(null);
  const number = useRef<HTMLDivElement>(null);

  /* The card rises into place, then its number counts up to what it says and
     the sparkline draws in behind it. Each card in the strip is a beat after
     the one to its left, so the row reads left to right instead of appearing
     all at once - and the numbers read as figures arrived at. */
  useGSAP(() => {
    if (card.current) {
      gsap.from(card.current, {
        opacity: 0,
        y: 10,
        duration: dur(DUR.slow),
        ease: EASE.entrance,
        delay: dur(index * STAGGER.cards),
      });
    }

    const el = number.current;
    // Nothing to count on a value with no number in it, and nothing to count
    // for someone who has asked for less motion - it keeps what it says.
    if (!el || prefersReducedMotion()) return;
    const parts = parseNumeric(value);
    if (!parts) return;

    const proxy = { n: 0 };
    gsap.to(proxy, {
      n: parts.value,
      duration: DUR.count,
      ease: EASE.entrance,
      delay: index * STAGGER.cards + 0.12,
      onUpdate: () => {
        el.textContent = formatNumeric(proxy.n, parts);
      },
      // Land on exactly what was authored, never on a rounding of it.
      onComplete: () => {
        el.textContent = value;
      },
    });
  }, [value]);

  return (
    <div
      ref={card}
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
          {/* Rendered with its real value, so the number is right before any
              of this runs and right again if it never does. */}
          <div ref={number} className="text-2xl font-bold text-gray-900 leading-none mb-2">
            {value}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {direction !== "flat" && <Arrow size={11} strokeWidth={2} />}
            <span>{trend}</span>
          </div>
        </div>
        <Sparkline variant={sparkline} index={index} />
      </div>
    </div>
  );
}
