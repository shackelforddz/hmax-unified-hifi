"use client";

import { BarChart, Bar, XAxis, YAxis, LabelList, ResponsiveContainer } from "recharts";
import { VENDOR_CONCENTRATION as V } from "@/lib/dashboard-data";
import WidgetChat from "./widget-chat";

const max = Math.max(...V.bars.map((b) => b.amount));

/* Recharts spreads unrecognised datum fields onto the rendered <path>, so a
   field called `display` lands as the SVG display attribute and hides the bar.
   Remap to keys that can't collide with presentation attributes. */
const DATA = V.bars.map((b) => ({
  vendor: b.name,
  amount: b.amount,
  amountLabel: b.display,
  projects: b.projects,
}));

// Two-line category tick under each column: vendor name + project count
function VendorTick({ x, y, payload }: { x?: number; y?: number; payload?: { value?: string } }) {
  const bar = DATA.find((b) => b.vendor === payload?.value);
  return (
    <text x={x} y={y} textAnchor="middle" fontFamily="inherit">
      <tspan x={x} dy="12" fontSize="11" fill="#404040">
        {payload?.value}
      </tspan>
      <tspan x={x} dy="13" fontSize="10" fill="#A3A3A3">
        {bar ? `${bar.projects} project${bar.projects > 1 ? "s" : ""}` : ""}
      </tspan>
    </text>
  );
}

export default function VendorConcentration() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base text-gray-900">Vendor concentration</h3>
          <p className="text-sm text-gray-400 mt-0.5">{V.caption}</p>
        </div>
        <WidgetChat title="Vendor concentration" />
      </div>

      {/* Chart - grows to fill the tile. The absolute box gives
          ResponsiveContainer a definite height to measure against. */}
      <div className="relative flex-1 min-h-[200px]">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DATA} margin={{ top: 22, right: 4, bottom: 4, left: 4 }} barCategoryGap="24%">
              <XAxis dataKey="vendor" interval={0} height={36} tick={<VendorTick />} tickLine={false} axisLine={false} />
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
