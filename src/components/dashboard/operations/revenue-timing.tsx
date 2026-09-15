"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { REVENUE_TIMING as R } from "@/lib/operations-data";
import WidgetChat from "@/components/dashboard/widget-chat";

export default function RevenueTiming() {
  const agingTotal = R.aging.reduce((s, a) => s + a.value, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base text-gray-900">Revenue &amp; timing</h3>
          <p className="text-sm text-gray-400 mt-0.5">Invoiced vs collected · 6 months</p>
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
            <p className="text-xl text-gray-900 leading-tight">{k.value}</p>
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
            <Bar dataKey="invoiced" fill="#D4D4D4" radius={[3, 3, 0, 0]} />
            <Bar dataKey="collected" fill="#171717" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex gap-4 mt-1 mb-4">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-sm bg-gray-300 inline-block" /> Invoiced
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-sm bg-gray-900 inline-block" /> Collected
        </span>
      </div>

      {/* How long the unpaid balance has been sitting */}
      <p className="text-[11px] text-gray-400 tracking-wider mb-2">Outstanding by age</p>
      <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 mb-2">
        {R.aging.map((a, i) => (
          <div
            key={a.label}
            // Darker the older the debt.
            style={{ width: `${(a.value / agingTotal) * 100}%`, backgroundColor: ["#E5E5E5", "#A3A3A3", "#525252", "#171717"][i] }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {R.aging.map((a, i) => (
          <span key={a.label} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span
              className="w-2 h-2 rounded-sm inline-block"
              style={{ backgroundColor: ["#E5E5E5", "#A3A3A3", "#525252", "#171717"][i] }}
            />
            {a.label} £{a.value}m
          </span>
        ))}
      </div>
    </div>
  );
}
