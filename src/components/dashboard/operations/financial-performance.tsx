"use client";

import { ArrowDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, ResponsiveContainer } from "recharts";
import WidgetChat from "@/components/dashboard/widget-chat";
import { FINANCIALS as F } from "@/lib/operations-data";

export default function FinancialPerformance() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-base text-gray-900">Financial Performance</h3>
        <WidgetChat title="Financial Performance" />
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
            <p className="text-2xl text-gray-900 leading-tight mt-0.5">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Margin trend - grows to fill a taller tile */}
      <div className="flex flex-col flex-1 min-h-[120px]">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-gray-700">Margin trend</p>
          <span className="flex items-center gap-0.5 text-xs text-gray-400">
            <ArrowDown size={11} strokeWidth={2} /> {F.marginVsPlan} vs plan
          </span>
        </div>
        <div className="relative flex-1 min-h-[120px]">
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={F.trend} margin={{ top: 10, right: 14, bottom: 0, left: 14 }}>
            <defs>
              <linearGradient id="finArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#171717" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#171717" stopOpacity={0} />
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
            <Area type="monotone" dataKey="value" stroke="#171717" strokeWidth={2} fill="url(#finArea)" dot={{ r: 2, fill: "#fff", stroke: "#171717", strokeWidth: 1.5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Variance causes */}
      <div className="mt-4">
        <p className="text-[11px] text-gray-400 tracking-wider mb-2">Margin variance · causes</p>
        <div className="flex flex-col gap-1.5">
          {F.causes.map((c) => (
            <div key={c.label} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{c.label}</span>
              <span className="text-sm text-gray-900">{c.impact}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
