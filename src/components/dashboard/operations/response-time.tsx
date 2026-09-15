"use client";

import { ArrowDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, ResponsiveContainer } from "recharts";
import { RESPONSE_TIME as R } from "@/lib/operations-data";
import WidgetChat from "@/components/dashboard/widget-chat";

export default function ResponseTime() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-base text-gray-900">Response time</h3>
          <p className="text-sm text-gray-400 mt-0.5">First qualified response vs {R.target}h SLA · 6 months</p>
        </div>
        <WidgetChat title="Response time" />
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl text-gray-900 leading-none">{R.current}</span>
        <span className="flex items-center gap-0.5 text-xs text-gray-400 mb-0.5">
          <ArrowDown size={11} strokeWidth={2} />
          {R.delta}
        </span>
      </div>

      <div className="h-[130px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={R.points} margin={{ top: 12, right: 14, bottom: 0, left: 14 }}>
            <defs>
              <linearGradient id="responseArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#171717" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#171717" stopOpacity={0} />
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
              stroke="#171717"
              strokeWidth={2}
              fill="url(#responseArea)"
              dot={{ r: 2, fill: "#ffffff", stroke: "#171717", strokeWidth: 1.5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Response against SLA, by case priority */}
      <div className="flex flex-col gap-2 mt-3">
        {R.byPriority.map((p) => (
          <div key={p.label} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-16 shrink-0">{p.label}</span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${p.within >= 90 ? "bg-gray-900" : "bg-gray-400"}`}
                style={{ width: `${p.within}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 shrink-0 w-24 text-right whitespace-nowrap">
              {p.value} · {p.within}% in SLA
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
