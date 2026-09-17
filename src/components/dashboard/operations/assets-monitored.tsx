"use client";

import { ArrowUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { CHART } from "@/lib/chart-theme";
import { ASSETS_MONITORED as A } from "@/lib/operations-data";
import WidgetChat from "@/components/dashboard/widget-chat";

/* Healthy / at risk / critical - condition reads as colour, not shade. */
const CONDITION = ["#10B981", "#F59E0B", "#FA000F"];

export default function AssetsMonitored() {
  const total = A.breakdown.reduce((s, b) => s + b.value, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-base text-gray-900">Assets monitored</h3>
        </div>
        <WidgetChat title="Assets monitored" />
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className="text-2xl font-bold text-gray-900 leading-none">{A.total}</span>
        <span className="flex items-center gap-0.5 text-xs text-gray-400 mb-0.5">
          <ArrowUp size={11} strokeWidth={2} />
          {A.delta}
        </span>
      </div>

      {/* Coverage growth - grows to fill a taller tile */}
      <div className="relative flex-1 min-h-[110px]">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={A.points} margin={{ top: 8, right: 14, bottom: 0, left: 14 }}>
            <defs>
              <linearGradient id="assetsArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART.fill} stopOpacity={0.18} />
                <stop offset="100%" stopColor={CHART.fill} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" interval={0} tick={{ fontSize: 10, fill: "#A3A3A3" }} tickLine={false} axisLine={false} />
            <YAxis domain={["dataMin - 10", "dataMax + 5"]} hide />
            <Area {...CHART.motion}
              type="monotone"
              dataKey="value"
              stroke={CHART.line}
              strokeWidth={2}
              fill="url(#assetsArea)"
              dot={{ r: 2, fill: "#ffffff", stroke: CHART.line, strokeWidth: 1.5 }}
            />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Condition split */}
      <p className="text-[11px] text-gray-400 tracking-wider mt-3 mb-2">By condition</p>
      <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 mb-2">
        {A.breakdown.map((b, i) => (
          <div key={b.label} style={{ width: `${(b.value / total) * 100}%`, backgroundColor: CONDITION[i] }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {A.breakdown.map((b, i) => (
          <span key={b.label} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: CONDITION[i] }} />
            {b.label} {b.value}
          </span>
        ))}
      </div>
    </div>
  );
}
