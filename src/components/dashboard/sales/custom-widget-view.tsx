"use client";

import { MessageCircle } from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, LabelList, ResponsiveContainer,
} from "recharts";
import WidgetChat from "@/components/dashboard/widget-chat";
import { type CustomWidgetConfig, formatValue } from "@/lib/custom-widget";
import { CHART } from "@/lib/chart-theme";

const GRAYS = ["#171717", "#737373", "#A3A3A3", "#D4D4D4", "#E5E5E5"];

/* The chart's plot area. With `fill` it grows to the tile's height (the
   absolute box gives ResponsiveContainer a definite height to measure);
   otherwise - e.g. inline in a conversation - it keeps a fixed height. */
function Plot({
  fill,
  height,
  width = "100%",
  className = "flex-1",
  children,
}: {
  fill: boolean;
  height: number;
  width?: `${number}%`;
  /** How the plot sizes inside its flex parent when filling. */
  className?: string;
  children: React.ReactElement;
}) {
  if (!fill) {
    return (
      <ResponsiveContainer width={width} height={height}>
        {children}
      </ResponsiveContainer>
    );
  }
  return (
    <div className={`relative ${className}`} style={{ minHeight: height, width }}>
      <div className="absolute inset-0">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ChartBody({ config, fill = false }: { config: CustomWidgetConfig; fill?: boolean }) {
  const { type, series, unit } = config;
  const root = fill ? "flex-1 flex flex-col min-h-0" : "";

  if (type === "kpi") {
    const latest = series[series.length - 1].value;
    const first = series[0].value;
    const delta = Math.round((latest - first) * 10) / 10;
    return (
      <div className={root}>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-2xl font-bold text-gray-900 leading-none">{formatValue(latest, unit)}</span>
          <span className="text-xs text-gray-400 mb-0.5">
            {delta >= 0 ? "+" : ""}{delta}{unit === "%" ? "pp" : ""} vs start
          </span>
        </div>
        <Plot fill={fill} height={90}>
          <LineChart data={series} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Line {...CHART.motion} type="monotone" dataKey="value" stroke={CHART.line} strokeWidth={2} dot={false} />
          </LineChart>
        </Plot>
      </div>
    );
  }

  if (type === "donut") {
    return (
      <div className={`flex items-center gap-4 ${fill ? "flex-1 min-h-0" : ""}`}>
        <Plot fill={fill} height={150} width="55%" className="self-stretch shrink-0">
          <PieChart>
            <Pie {...CHART.motion} data={series} dataKey="value" nameKey="label" innerRadius="50%" outerRadius="83%" paddingAngle={2} stroke="none">
              {series.map((_, i) => (
                <Cell key={i} fill={GRAYS[i % GRAYS.length]} />
              ))}
            </Pie>
          </PieChart>
        </Plot>
        <div className="flex flex-col gap-1.5">
          {series.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: GRAYS[i % GRAYS.length] }} />
              <span className="text-xs text-gray-600">{s.label}</span>
              <span className="text-xs text-gray-400 ml-auto">{formatValue(s.value, unit)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "bar") {
    const max = Math.max(...series.map((s) => s.value));
    return (
      <div className={root}>
        <Plot fill={fill} height={Math.max(120, series.length * 34)}>
          <BarChart layout="vertical" data={series} margin={{ top: 4, right: 40, bottom: 0, left: 8 }} barCategoryGap={10}>
            <XAxis type="number" domain={[0, max]} hide />
            <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 12, fill: "#525252" }} tickLine={false} axisLine={false} />
            <Bar {...CHART.motion} dataKey="value" fill={CHART.line} radius={[4, 4, 4, 4]} barSize={12}>
              <LabelList dataKey="value" position="right" fontSize={12} fill="#171717" formatter={(v) => formatValue(Number(v ?? 0), unit)} />
            </Bar>
          </BarChart>
        </Plot>
      </div>
    );
  }

  // line (default)
  return (
    <div className={root}>
      <Plot fill={fill} height={150}>
        <AreaChart data={series} margin={{ top: 12, right: 14, bottom: 0, left: 14 }}>
          <defs>
            <linearGradient id={`cwArea-${config.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#171717" stopOpacity={0.15} />
              <stop offset="100%" stopColor={CHART.fill} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" interval={0} tick={{ fontSize: 10, fill: "#A3A3A3" }} tickLine={false} axisLine={false} />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Area {...CHART.motion} type="monotone" dataKey="value" stroke={CHART.line} strokeWidth={2} fill={`url(#cwArea-${config.id})`} dot={{ r: 2, fill: "#fff", stroke: CHART.line, strokeWidth: 1.5 }} />
        </AreaChart>
      </Plot>
    </div>
  );
}

interface Props {
  config: CustomWidgetConfig;
  /** In the builder preview the chat icon is inert. */
  static?: boolean;
}

export default function CustomWidgetView({ config, static: isStatic }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      <div className="flex items-start justify-between mb-4 gap-3">
        <h3 className="text-base text-gray-900 leading-snug">{config.title}</h3>
        {isStatic ? (
          <MessageCircle size={16} strokeWidth={1.5} className="text-gray-300 shrink-0" />
        ) : (
          <WidgetChat title={config.title} />
        )}
      </div>
      <ChartBody config={config} fill />
    </div>
  );
}
