"use client";

import { ArrowUp } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import WidgetChat from "@/components/dashboard/widget-chat";
import { REPORT_TURNAROUND as T } from "@/lib/field-reports-data";
import { CHART } from "@/lib/chart-theme";

export default function ReportTurnaround() {
  const overTarget = T.actualDays - T.targetDays;
  const maxStage = Math.max(...T.stages.map((s) => s.days));
  const slowest = T.stages.reduce((a, b) => (b.days > a.days ? b : a));
  const spark = T.trend.map((v) => ({ v }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base text-gray-900">How long a field report actually takes</h3>
        <WidgetChat title="Field report turnaround" />
      </div>

      <div className="flex items-center gap-6">
        {/* Headline: actual vs target + trend */}
        <div className="shrink-0 w-40">
          <div className="flex items-end gap-1">
            <p className="text-3xl font-bold text-gray-900 leading-none">{T.actualDays}</p>
            <p className="text-sm text-gray-400 mb-0.5">days</p>
          </div>
          <p className="flex items-center gap-1 text-xs text-gray-500 mt-1.5">
            {overTarget > 0 && <ArrowUp size={11} strokeWidth={2} className="shrink-0" />}
            <span className="text-gray-700">{overTarget > 0 ? `${overTarget} days` : "on target"}</span>
            <span className="text-gray-400">vs {T.targetDays}-day target</span>
          </p>
          <div className="w-full h-8 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="turnaroundSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.fill} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={CHART.fill} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={CHART.line} strokeWidth={2} fill="url(#turnaroundSpark)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stage breakdown - where the time goes */}
        <div className="flex-1 min-w-0 border-l border-gray-100 pl-6">
          <p className="text-[11px] text-gray-400 tracking-wider mb-2">Where the time goes</p>
          <div className="flex flex-col gap-1.5">
            {T.stages.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-44 shrink-0">{s.label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.label === slowest.label ? "bg-status-critical" : "bg-chart-line"}`}
                    style={{ width: `${(s.days / maxStage) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-700 w-10 text-right shrink-0">{s.days}d</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Bottleneck: {slowest.label.toLowerCase()} ({slowest.days} days)
          </p>
        </div>
      </div>
    </div>
  );
}
