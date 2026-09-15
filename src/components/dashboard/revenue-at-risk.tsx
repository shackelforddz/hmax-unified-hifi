"use client";

import { BarChart, Bar, XAxis, YAxis, LabelList, ResponsiveContainer } from "recharts";
import { REVENUE_AT_RISK as R } from "@/lib/dashboard-data";
import WidgetChat from "./widget-chat";

const max = Math.max(...R.bars.map((b) => b.amount));

/* `display` would land on the SVG element as a presentation attribute, so the
   label rides along under a name that cannot collide. */
const DATA = R.bars.map((b) => ({ trigger: b.label, amount: b.amount, amountLabel: b.display }));

// Trigger names are long, so each column's label wraps onto two lines.
function TriggerTick({ x, y, payload }: { x?: number; y?: number; payload?: { value?: string } }) {
  const words = String(payload?.value ?? "").split(" ");
  const lines = words.length > 1 ? [words[0], words.slice(1).join(" ")] : words;
  return (
    <text x={x} y={y} textAnchor="middle" fontFamily="inherit" fontSize="11" fill="#525252">
      {lines.map((line, i) => (
        <tspan key={line} x={x} dy={i === 0 ? 12 : 12}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

export default function RevenueAtRisk() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-base text-gray-900">Revenue at risk</h3>
          <p className="text-sm text-gray-400 mt-0.5">by trigger · this quarter</p>
        </div>
        <WidgetChat title="Revenue at risk" />
      </div>

      {/* Total */}
      <div className="flex items-end gap-2 mb-2">
        <span className="text-3xl text-gray-900 leading-none">{R.total}</span>
        <span className="text-xs text-gray-400 mb-0.5">{R.caption}</span>
      </div>

      {/* Chart - grows to fill the tile */}
      <div className="relative flex-1 min-h-[150px]">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DATA} margin={{ top: 22, right: 4, bottom: 4, left: 4 }} barCategoryGap="24%">
              <XAxis dataKey="trigger" interval={0} height={36} tick={<TriggerTick />} tickLine={false} axisLine={false} />
              <YAxis type="number" domain={[0, max]} hide />
              <Bar dataKey="amount" fill="#171717" radius={[4, 4, 0, 0]} maxBarSize={44}>
                <LabelList dataKey="amountLabel" position="top" fontSize={11} fill="#171717" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
