"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, X } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, ResponsiveContainer } from "recharts";
import { DELIVERY_TREND as D, type TrendPoint } from "@/lib/dashboard-data";
import WidgetChat from "./widget-chat";
import ContractDrawer from "./operations/contract-drawer";

const POPOVER_W = 300;

/* The contracts behind a clicked point. Anchored to the point itself and
   clamped to the chart box so it never runs off the widget. */
function ImpactPopover({
  point,
  x,
  y,
  width,
  onOpenContract,
  onClose,
}: {
  point: TrendPoint;
  x: number;
  y: number;
  width: number;
  onOpenContract: (contractId: string) => void;
  onClose: () => void;
}) {
  const left = Math.max(0, Math.min(x - POPOVER_W / 2, width - POPOVER_W));

  return (
    <div
      style={{ left, top: y + 14, width: POPOVER_W }}
      className="absolute z-30 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-message-in"
    >
      <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900">
            {point.label} · {point.value}% on time
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {point.impacts?.length
              ? `${point.impacts.length} contract${point.impacts.length > 1 ? "s" : ""} moved this month`
              : "No contract-level driver recorded"}
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

      <div className="max-h-[220px] overflow-y-auto no-scrollbar p-2">
        {point.impacts?.map((impact) => (
          <button
            key={`${impact.contractId}-${impact.reason}`}
            onClick={() => onOpenContract(impact.contractId)}
            className="w-full text-left px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <p className="text-sm text-gray-800 leading-snug mb-0.5">{impact.contract}</p>
            <p className="text-xs text-gray-400 mb-1">{impact.customer}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{impact.reason}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DeliveryTrend() {
  // The clicked point, plus where its dot sits inside the chart box.
  const [selected, setSelected] = useState<{ index: number; x: number; y: number } | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setChartWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Dismiss on outside click or Escape - the drawer has its own dismissal.
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

  const point = selected ? D.points[selected.index] : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      <ContractDrawer contractId={contractId} onClose={() => setContractId(null)} />

      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-base text-gray-900">Delivery performance</h3>
          <p className="text-sm text-gray-400 mt-0.5">{D.metric} vs 85% target · 6 months</p>
        </div>
        <WidgetChat title="Delivery performance" />
      </div>

      {/* Big value */}
      <div className="flex items-end gap-2 mb-1">
        <span className="text-3xl text-gray-900 leading-none">{D.current}</span>
        <span className="flex items-center gap-0.5 text-xs text-gray-400 mb-0.5">
          <ArrowDown size={11} strokeWidth={2} />
          {D.delta}
        </span>
      </div>

      {/* Chart - grows into whatever height the tile is given. The absolute
          box gives ResponsiveContainer a definite height to measure against. */}
      <div ref={chartRef} className="relative flex-1 min-h-[140px]">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={D.points} margin={{ top: 12, right: 14, bottom: 0, left: 14 }}>
            <defs>
              <linearGradient id="deliveryArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#171717" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#171717" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              interval={0}
              tick={{ fontSize: 10, fill: "#A3A3A3" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis domain={[D.min, D.max]} hide />
            <ReferenceLine
              y={D.target}
              stroke="#D4D4D4"
              strokeDasharray="3 3"
              label={{ value: "Target 85%", position: "insideTopRight", fontSize: 9, fill: "#A3A3A3" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#171717"
              strokeWidth={2}
              fill="url(#deliveryArea)"
              // Each dot is its own click target - an invisible r=14 hit area
              // around a small visible dot, so the points are easy to hit.
              // The selected point reads as filled; the rest stay hollow.
              dot={(props) => {
                const { cx, cy, index } = props as { cx: number; cy: number; index: number };
                const active = selected?.index === index;
                return (
                  <g
                    key={index}
                    role="button"
                    tabIndex={0}
                    aria-label={`${D.points[index].label}: ${D.points[index].value}% on time`}
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
                      fill={active ? "#171717" : "#ffffff"}
                      stroke="#171717"
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
          <ImpactPopover
            point={point}
            x={selected.x}
            y={selected.y}
            width={chartWidth}
            onOpenContract={(id) => {
              setSelected(null);
              setContractId(id);
            }}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  );
}
