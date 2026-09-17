"use client";

import { ArrowDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, ResponsiveContainer } from "recharts";
import { CHART } from "@/lib/chart-theme";
import { RESPONSE_TIME as R } from "@/lib/operations-data";
import WidgetChat from "@/components/dashboard/widget-chat";

export default function ResponseTime() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-base text-gray-900">Response time</h3>
        </div>
        <WidgetChat title="Response time" />
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className="text-2xl font-bold text-gray-900 leading-none">{R.current}</span>
        <span className="flex items-center gap-0.5 text-xs text-gray-400 mb-0.5">
          <ArrowDown size={11} strokeWidth={2} />
          {R.delta}
        </span>
      </div>

      {/* Grows to fill the tile; the absolute box gives ResponsiveContainer
          a definite height to measure against. */}
      <div className="relative flex-1 min-h-[130px]">
        <div className="absolute inset-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={R.points} margin={{ top: 12, right: 14, bottom: 0, left: 14 }}>
            <defs>
              <linearGradient id="responseArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART.fill} stopOpacity={0.18} />
                <stop offset="100%" stopColor={CHART.fill} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" interval={0} tick={{ fontSize: 10, fill: "#A3A3A3" }} tickLine={false} axisLine={false} />
            <YAxis domain={[R.min, R.max]} hide />
            <ReferenceLine
              y={R.target}
              stroke="#D4D4D4"
              strokeDasharray="3 3"
              label={{ value: `SLA ${R.target}h`, position: "insideTopRight", fontSize: 9, fill: "#A3A3A3" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={CHART.line}
              strokeWidth={2}
              fill="url(#responseArea)"
              dot={{ r: 2, fill: "#ffffff", stroke: CHART.line, strokeWidth: 1.5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
