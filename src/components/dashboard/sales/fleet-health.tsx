"use client";

import { LineChart, Line, YAxis, ResponsiveContainer } from "recharts";
import { CHART } from "@/lib/chart-theme";
import { FLEET_HEALTH as F } from "@/lib/sales-data";
import WidgetChat from "@/components/dashboard/widget-chat";
import WidgetAlert, { WidgetAttentionGlow } from "@/components/dashboard/widget-alert";
import { ATTENTION_DETAIL, NEEDS_ATTENTION } from "@/lib/widget-attention";

export default function FleetHealth() {
  return (
    <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-base text-gray-900">Average Asset Health</h3>
        <div className="flex items-center gap-2 shrink-0">
  <WidgetChat title="Average Asset Health" />
          {NEEDS_ATTENTION.fleetHealth && <WidgetAlert {...ATTENTION_DETAIL.fleetHealth} />}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div>
          <p className="text-xs text-gray-400">30 days ago</p>
          <p className="text-2xl font-bold text-gray-900 leading-tight">{F.past}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Today</p>
          <p className="text-2xl font-bold text-gray-900 leading-tight">{F.today}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Change</p>
          <p className="text-2xl font-bold text-gray-900 leading-tight">{F.change}</p>
        </div>
      </div>

      {/* Chart - grows to fill the container height. The inner absolute box
          gives ResponsiveContainer a definite height to measure: a percentage
          height against a flex item sized only by min-height resolves to 0. */}
      <div className="relative flex-1 min-h-[120px]">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={F.points} margin={{ top: 8, right: 4, bottom: 4, left: 4 }}>
              <YAxis domain={[55, 92]} hide />
              <Line {...CHART.motion} type="monotone" dataKey="avg" stroke={CHART.line} strokeWidth={2} dot={false} />
              <Line {...CHART.motion} type="monotone" dataKey="std" stroke="#A3A3A3" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-2">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: CHART.line }} /> Average Asset Health
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-0.5 bg-gray-400 inline-block" style={{ backgroundImage: "repeating-linear-gradient(90deg,#A3A3A3 0 3px,transparent 3px 6px)" }} /> Asset Health Standard
        </span>
      </div>
      {NEEDS_ATTENTION.fleetHealth && <WidgetAttentionGlow />}
    </div>
  );
}
