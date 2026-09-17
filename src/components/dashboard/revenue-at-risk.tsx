"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, LabelList, ResponsiveContainer } from "recharts";
import { CHART } from "@/lib/chart-theme";
import { REVENUE_AT_RISK as R, VENDOR_CONCENTRATION as V } from "@/lib/dashboard-data";
import WidgetChat from "./widget-chat";

const TITLE = "Revenue at risk";

/* The same money, cut two ways: what is putting it at risk, and who we are
   exposed to. Recharts spreads unrecognised datum fields onto the rendered
   <path>, so a field called `display` would land as the SVG display attribute
   and hide the bar - hence `amountLabel`. */
const BY_TRIGGER = R.bars.map((b) => ({ key: b.label, amount: b.amount, amountLabel: b.display, sub: "" }));
const BY_VENDOR = V.bars.map((b) => ({
  key: b.name,
  amount: b.amount,
  amountLabel: b.display,
  sub: `${b.projects} project${b.projects > 1 ? "s" : ""}`,
}));

const VIEWS = { "By trigger": BY_TRIGGER, "By vendor": BY_VENDOR };
type View = keyof typeof VIEWS;

/** Category tick: name over two lines if it needs them, then an optional
 *  sub-label. Written by hand so long trigger names wrap instead of colliding. */
function CategoryTick({
  x,
  y,
  payload,
  rows,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
  rows: { key: string; sub: string }[];
}) {
  const value = String(payload?.value ?? "");
  const words = value.split(" ");
  const lines = words.length > 1 ? [words[0], words.slice(1).join(" ")] : words;
  const sub = rows.find((r) => r.key === value)?.sub;
  return (
    <text x={x} y={y} textAnchor="middle" fontFamily="inherit">
      {lines.map((line, i) => (
        <tspan key={line} x={x} dy={i === 0 ? 12 : 12} fontSize="11" fill="#404040">
          {line}
        </tspan>
      ))}
      {sub && (
        <tspan x={x} dy="13" fontSize="10" fill="#A3A3A3">
          {sub}
        </tspan>
      )}
    </text>
  );
}

export default function RevenueAtRisk() {
  const [view, setView] = useState<View>("By trigger");
  const rows = VIEWS[view];
  const max = Math.max(...rows.map((b) => b.amount));

  const tab = (active: boolean) =>
    `h-full flex-1 flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
      active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
    }`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-base text-gray-900">{TITLE}</h3>
        <WidgetChat title={TITLE} />
      </div>

      {/* Total */}
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-gray-900 leading-none">{R.total}</span>
        <span className="text-xs text-gray-400 mb-0.5">{R.caption}</span>
      </div>

      {/* Same total, two cuts */}
      <div role="tablist" aria-label="Revenue at risk breakdown" className="bg-gray-100 h-8 flex items-center p-[3px] rounded-full mt-3">
        {(Object.keys(VIEWS) as View[]).map((v) => (
          <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={tab(view === v)}>
            {v}
          </button>
        ))}
      </div>

      {/* Chart - grows to fill the tile. The absolute box gives
          ResponsiveContainer a definite height to measure against. */}
      <div className="relative flex-1 min-h-[170px] mt-2">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 22, right: 4, bottom: 4, left: 4 }} barCategoryGap="24%">
              <XAxis
                dataKey="key"
                interval={0}
                height={48}
                tick={<CategoryTick rows={rows} />}
                tickLine={false}
                axisLine={false}
              />
              <YAxis type="number" domain={[0, max]} hide />
              <Bar {...CHART.motion} dataKey="amount" fill={CHART.line} radius={[4, 4, 0, 0]} maxBarSize={44}>
                <LabelList dataKey="amountLabel" position="top" fontSize={11} fontWeight={700} fill="#171717" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
