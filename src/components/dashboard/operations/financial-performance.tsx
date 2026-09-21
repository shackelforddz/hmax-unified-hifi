"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, ResponsiveContainer } from "recharts";
import { CHART } from "@/lib/chart-theme";
import WidgetChat from "@/components/dashboard/widget-chat";
import WidgetAlert, { WidgetAttentionGlow } from "@/components/dashboard/widget-alert";
import { ATTENTION_DETAIL, NEEDS_ATTENTION } from "@/lib/widget-attention";
import { FINANCIALS as F, type MarginPoint } from "@/lib/operations-data";

const POPOVER_W = 260;

/* What moved margin in the clicked month. Anchored to the point and clamped
   to the chart box so it never runs off the widget. */
function CausesPopover({
  point,
  x,
  y,
  width,
  height,
  onClose,
}: {
  point: MarginPoint;
  x: number;
  y: number;
  width: number;
  height: number;
  onClose: () => void;
}) {
  const left = Math.max(0, Math.min(x - POPOVER_W / 2, width - POPOVER_W));
  // Header, one row per cause, plus the list padding.
  const estimated = 56 + point.causes.length * 40 + (point.causes.length ? 16 : 0);
  // Open upward when there isn't room below the dot, anchoring the card's
  // bottom edge to the point instead of its top.
  const openUp = y + 14 + estimated > height;

  return (
    <div
      style={
        openUp
          ? { left, bottom: height - y + 14, width: POPOVER_W }
          : { left, top: y + 14, width: POPOVER_W }
      }
      className="absolute z-30 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-pop-in"
    >
      <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900">
            {point.label} · {point.value}% margin
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {point.causes.length
              ? `${point.causes.length} cause${point.causes.length > 1 ? "s" : ""} against plan`
              : "On plan - no variance recorded"}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-black/5 transition-colors cursor-pointer"
        >
          <X size={13} strokeWidth={1.5} />
        </button>
      </div>

      {point.causes.length > 0 && (
        <div className="max-h-[200px] overflow-y-auto no-scrollbar p-2">
          {point.causes.map((c) => (
            <div key={c.label} className="flex items-baseline justify-between gap-3 px-2 py-2">
              <span className="text-sm text-gray-700 leading-snug">{c.label}</span>
              <span className="text-sm text-gray-900 shrink-0">{c.impact}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FinancialPerformance() {
  // The clicked point, plus where its dot sits inside the chart box.
  const [selected, setSelected] = useState<{ index: number; x: number; y: number } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartBox, setChartBox] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setChartBox({ width: entry.contentRect.width, height: entry.contentRect.height })
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Dismiss on outside click or Escape.
  useEffect(() => {
    if (!selected) return;
    const onDown = (e: MouseEvent) => {
      if (chartRef.current && !chartRef.current.contains(e.target as Node)) setSelected(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [selected]);

  const point = selected ? F.trend[selected.index] : null;

  return (
    <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-base text-gray-900">Financial Performance</h3>
        <div className="flex items-center gap-2 shrink-0">
  <WidgetChat title="Financial Performance" />
          {NEEDS_ATTENTION.financial && <WidgetAlert {...ATTENTION_DETAIL.financial} />}
        </div>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { label: "Forecast margin", value: F.forecastMargin },
          { label: "Revenue", value: F.revenue },
          { label: "Cost", value: F.cost },
        ].map((k) => (
          <div key={k.label}>
            <p className="text-xs text-gray-400">{k.label}</p>
            <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Margin over time - click a point for what moved it that month */}
      <div className="flex flex-col flex-1 min-h-[120px]">
        <div ref={chartRef} className="relative flex-1 min-h-[120px]">
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={F.trend} margin={{ top: 10, right: 14, bottom: 0, left: 14 }}>
                <defs>
                  <linearGradient id="finArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.fill} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={CHART.fill} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" interval={0} tick={{ fontSize: 10, fill: "#A3A3A3" }} tickLine={false} axisLine={false} />
                <YAxis domain={[18, 20]} hide />
                <ReferenceLine
                  y={F.planMargin}
                  stroke="#D4D4D4"
                  strokeDasharray="3 3"
                  label={{ value: `Plan ${F.planMargin}%`, position: "insideTopRight", fontSize: 9, fill: "#A3A3A3" }}
                />
                <Area {...CHART.motion}
                  type="monotone"
                  dataKey="value"
                  stroke={CHART.line}
                  strokeWidth={2}
                  fill="url(#finArea)"
                  // Each dot is its own click target - an invisible r=14 hit
                  // area around a small visible dot. The selected point reads
                  // as filled; the rest stay hollow.
                  dot={(props) => {
                    const { cx, cy, index } = props as { cx: number; cy: number; index: number };
                    const active = selected?.index === index;
                    const p = F.trend[index];
                    return (
                      <g
                        key={index}
                        role="button"
                        tabIndex={0}
                        aria-label={`${p.label}: ${p.value}% margin, ${p.causes.length} cause${p.causes.length === 1 ? "" : "s"}`}
                        style={{ cursor: "pointer", pointerEvents: "all", outline: "none" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected((prev) => (prev?.index === index ? null : { index, x: cx, y: cy }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter" && e.key !== " ") return;
                          e.preventDefault();
                          setSelected((prev) => (prev?.index === index ? null : { index, x: cx, y: cy }));
                        }}
                      >
                        <circle cx={cx} cy={cy} r={14} fill="transparent" />
                        <circle
                          cx={cx}
                          cy={cy}
                          r={active ? 4 : 2.5}
                          fill={active ? CHART.line : "#ffffff"}
                          stroke={CHART.line}
                          strokeWidth={1.5}
                        />
                      </g>
                    );
                  }}
                  activeDot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {point && selected && (
            <CausesPopover
              point={point}
              x={selected.x}
              y={selected.y}
              width={chartBox.width}
              height={chartBox.height}
              onClose={() => setSelected(null)}
            />
          )}
        </div>
      </div>
      {NEEDS_ATTENTION.financial && <WidgetAttentionGlow />}
    </div>
  );
}
