"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { CHART } from "@/lib/chart-theme";

/* Cash in the door reads as healthy green against the invoiced blue. */
const COLLECTED = "#10B981";
import { REVENUE_TIMING as R } from "@/lib/operations-data";
import WidgetChat from "@/components/dashboard/widget-chat";

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
            <p className="text-xl font-bold text-gray-900 leading-tight">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Invoiced vs collected - the gap is the timing problem */}
      {/* Grows to fill a taller tile; the absolute box gives ResponsiveContainer
          a definite height to measure against. */}
      <div className="relative flex-1 min-h-[120px]">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={R.points} margin={{ top: 8, right: 8, bottom: 0, left: 8 }} barGap={2}>
            <XAxis dataKey="label" interval={0} tick={{ fontSize: 10, fill: "#A3A3A3" }} tickLine={false} axisLine={false} />
            <YAxis hide />
            <Bar dataKey="invoiced" fill={CHART.line} radius={[3, 3, 0, 0]} />
            <Bar dataKey="collected" fill={COLLECTED} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex gap-4 mt-1 mb-4">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: CHART.line }} /> Invoiced
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: COLLECTED }} /> Collected
        </span>
      </div>

    </div>
  );
}
