"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { CHART } from "@/lib/chart-theme";

/* The outstanding gap reads as purple against the collected blue. */
const OUTSTANDING = "#A855F7";
import { REVENUE_TIMING as R } from "@/lib/operations-data";
import WidgetChat from "@/components/dashboard/widget-chat";

// Each month's bar is what was invoiced, split into the part collected and
// the part still outstanding - so the purple cap is the timing gap.
const POINTS = R.points.map((p) => ({
  label: p.label,
  collected: p.collected,
  outstanding: Math.round((p.invoiced - p.collected) * 10) / 10,
}));

export default function RevenueTiming() {

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base text-gray-900">Revenue &amp; timing</h3>
        </div>
        <WidgetChat title="Revenue & timing" />
      </div>

      {/* Headline */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: "Invoiced", value: R.invoiced },
          { label: "Collected", value: R.collected },
          { label: "Outstanding", value: R.outstanding },
        ].map((k) => (
          <div key={k.label}>
            <p className="text-xs text-gray-400">{k.label}</p>
            <p className="text-2xl font-bold text-gray-900 leading-tight">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Invoiced, stacked as collected + outstanding - the cap is the timing problem */}
      {/* Grows to fill a taller tile; the absolute box gives ResponsiveContainer
          a definite height to measure against. */}
      <div className="relative flex-1 min-h-[120px]">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={POINTS} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <XAxis dataKey="label" interval={0} tick={{ fontSize: 10, fill: "#A3A3A3" }} tickLine={false} axisLine={false} />
            <YAxis hide />
            <Bar dataKey="collected" stackId="invoiced" fill={CHART.line} />
            <Bar dataKey="outstanding" stackId="invoiced" fill={OUTSTANDING} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex gap-4 mt-1">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: CHART.line }} /> Collected
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: OUTSTANDING }} /> Outstanding
        </span>
      </div>

    </div>
  );
}
