"use client";

import { ArrowUp, RefreshCw, ShieldAlert, Activity, Clock } from "lucide-react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type {
  AssetCondition,
  AgingData,
  ScoreFactor,
  RiskSummary,
  ConditionPoint,
  ParameterPoint,
  ParameterRow,
  AssetDiagnostics,
  BulletMetric,
  PhasePoint,
} from "@/lib/sales-data";
import { CHART } from "@/lib/chart-theme";

/* Neutrals for axes and scale furniture; every data series is coloured. */
const INK = "#171717";
// Primary data series follow the shared chart accent.
const SERIES = CHART.line;
const [S1, S2, S3, S4] = CHART.ramp;
const G600 = "#404040";
const G500 = "#737373";
const G400 = "#A3A3A3";
const G300 = "#D4D4D4";
const G200 = "#E5E5E5";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base text-gray-900 mb-4">{children}</h3>;
}

/* ── Aging ───────────────────────────────────────────────────────── */
export function Aging({ d }: { d: AgingData }) {
  const pct = (v: number) => `${(v / d.scaleMax) * 100}%`;
  const ticks = Array.from({ length: Math.floor(d.scaleMax / 4) + 1 }, (_, i) => i * 4);
  return (
    <div>
      <SectionTitle>Aging</SectionTitle>
      <div className="relative h-9">
        {/* End-of-life shaded zone (beyond customer life) */}
        <div
          className="absolute top-0 bottom-0 bg-gray-100 rounded-r"
          style={{ left: pct(d.customerLife), right: 0 }}
        />
        {/* Age fill */}
        <div
          className="absolute top-1.5 bottom-1.5 bg-chart-line rounded"
          style={{ left: 0, width: pct(d.age) }}
        />
        {/* Manufacturer marker */}
        <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-gray-500" style={{ left: pct(d.manufacturerLife) }} />
        {/* Customer marker */}
        <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-gray-400" style={{ left: pct(d.customerLife) }} />
      </div>
      {/* Scale */}
      <div className="relative h-4 mt-1">
        {ticks.map((t) => (
          <span key={t} className="absolute text-[10px] text-gray-400 -translate-x-1/2" style={{ left: pct(t) }}>
            {t}
          </span>
        ))}
        <span className="absolute right-0 text-[10px] text-gray-400">yr</span>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[11px]">
        <span className="flex items-center gap-1.5 text-gray-600">
          <span className="w-3 h-2 rounded-sm bg-chart-line" /> Age {d.age} yr
        </span>
        <span className="flex items-center gap-1.5 text-gray-600">
          <span className="w-3 border-t-2 border-dashed border-gray-400" /> Customer {d.customerLife} yr
        </span>
        <span className="flex items-center gap-1.5 text-gray-600">
          <span className="w-3 border-t-2 border-dashed border-gray-500" /> Manufacturer {d.manufacturerLife} yr
        </span>
      </div>
    </div>
  );
}

/* ── Score Calculation ───────────────────────────────────────────── */
export function ScoreCalculation({ factors, total }: { factors: ScoreFactor[]; total: number }) {
  return (
    <div>
      <SectionTitle>Score Calculation</SectionTitle>
      <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0">
        <div className="grid grid-cols-[80px_1fr] items-center gap-x-3 col-span-2 pb-2 border-b border-gray-200 text-[11px] text-gray-400 tracking-wider">
          <span>Factor</span>
          <span>% of Max Value</span>
        </div>
        {factors.map((f) => (
          <div key={f.factor} className="grid grid-cols-[80px_1fr_auto] items-center gap-x-3 col-span-2 py-2.5 border-b border-gray-100 last:border-0">
            <span className="text-sm text-gray-700">{f.factor}</span>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xs text-gray-400 w-11 shrink-0 text-right">{f.pctOfMax.toFixed(1)}%</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-chart-line rounded-full" style={{ width: `${f.pctOfMax}%` }} />
              </div>
            </div>
            <span className="text-sm text-gray-900 tabular-nums text-right w-10">{f.value.toFixed(1)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-3 mt-1">
        <span className="text-sm text-gray-500">Total score</span>
        <span className="text-lg text-gray-900 tabular-nums">{total.toFixed(1)}</span>
      </div>
    </div>
  );
}

/* ── Risk Matrix + KPIs ──────────────────────────────────────────── */
export function RiskMatrix({ risk }: { risk: RiskSummary }) {
  // Position the asset in the matrix: x = condition (worse left→right?), y = importance
  const x = risk.condition; // 0–100
  const y = risk.importance; // 0–100
  return (
    <div>
      <SectionTitle>Risk Matrix</SectionTitle>
      <div className="grid grid-cols-[1fr_150px] gap-4">
        {/* Matrix */}
        <div className="relative aspect-[2/1] rounded-lg overflow-hidden border border-gray-200">
          {/* Diagonal greyscale risk bands via layered gradients */}
          <div className="absolute inset-0" style={{ background: `linear-gradient(105deg, ${G200} 0%, ${G200} 32%, ${G400} 46%, ${G400} 58%, ${G600} 72%, ${G600} 100%)` }} />
          {/* Grid guide lines */}
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 pointer-events-none">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="border-r border-b border-white/25" />
            ))}
          </div>
          {/* Asset marker */}
          <div
            className="absolute w-3.5 h-3.5 rounded-full bg-white border-2 border-gray-800 -translate-x-1/2 -translate-y-1/2 shadow"
            style={{ left: `${x}%`, top: `${100 - y}%` }}
            title={`Condition ${x} · Importance ${y}`}
          />
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-white/80 tracking-wider">Condition</span>
          <span className="absolute top-1/2 left-1 -translate-y-1/2 -rotate-90 origin-left text-[9px] text-white/80 tracking-wider">Importance</span>
        </div>
        {/* KPI stack */}
        <div className="flex flex-col gap-2">
          <Kpi icon={ShieldAlert} label="Importance" value={String(risk.importance)} />
          <Kpi icon={Activity} label="Condition" value={risk.condition.toFixed(1)} />
          <Kpi icon={RefreshCw} label="Replacement Rank" value={`#${risk.replacementRank}/${risk.replacementOf}`} accent />
          <Kpi icon={Clock} label="Last update" value={risk.lastUpdate} small />
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, accent, small }: { icon: React.ElementType; label: string; value: string; accent?: boolean; small?: boolean }) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg px-3 py-2">
      <p className="text-[10px] text-gray-400 tracking-wider leading-none mb-1.5">{label}</p>
      <div className="flex items-center gap-1.5">
        <Icon size={14} strokeWidth={1.5} className="text-gray-400 shrink-0" />
        <span className={`${small ? "text-sm" : "text-lg"} leading-none ${accent ? "text-gray-900 font-semibold" : "text-gray-900"}`}>{value}</span>
      </div>
    </div>
  );
}

/* ── Condition Trend (stacked area) ──────────────────────────────── */
const COND_KEYS: { key: keyof Omit<ConditionPoint, "date">; label: string; color: string }[] = [
  { key: "dielectric", label: "Dielectric", color: S1 },
  { key: "mechanical", label: "Mechanical", color: S2 },
  { key: "other", label: "Other", color: S3 },
  { key: "wear", label: "Wear", color: S4 },
];

export function ConditionTrend({ data, totals }: { data: ConditionPoint[]; totals: AssetCondition["conditionTotals"] }) {
  return (
    <div>
      <SectionTitle>Condition Trend</SectionTitle>
      <div className="grid grid-cols-[1fr_130px] gap-3 items-center">
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
            <XAxis dataKey="date" interval={2} tick={{ fontSize: 9, fill: G400 }} tickLine={false} axisLine={{ stroke: G200 }} />
            <YAxis tick={{ fontSize: 9, fill: G400 }} tickLine={false} axisLine={false} width={22} />
            {/* Stack order bottom→top: wear, other, mechanical, dielectric */}
            <Area type="monotone" dataKey="wear" stackId="1" stroke={S4} fill={S4} fillOpacity={0.9} strokeWidth={1} />
            <Area type="monotone" dataKey="other" stackId="1" stroke={S3} fill={S3} fillOpacity={0.9} strokeWidth={1} />
            <Area type="monotone" dataKey="mechanical" stackId="1" stroke={S2} fill={S2} fillOpacity={0.9} strokeWidth={1} />
            <Area type="monotone" dataKey="dielectric" stackId="1" stroke={S1} fill={S1} fillOpacity={0.9} strokeWidth={1} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-1.5">
          {COND_KEYS.map((k) => (
            <div key={k.key} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-gray-600">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: k.color }} /> {k.label}
              </span>
              <span className="text-gray-900 tabular-nums">{totals[k.key].toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Parameter Trend (line + table) ──────────────────────────────── */
export function ParameterTrend({ data, rows }: { data: ParameterPoint[]; rows: ParameterRow[] }) {
  return (
    <div>
      <SectionTitle>Parameter Trend</SectionTitle>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 6, right: 10, bottom: 0, left: 0 }}>
          <XAxis dataKey="date" interval={1} tick={{ fontSize: 9, fill: G400 }} tickLine={false} axisLine={{ stroke: G200 }} />
          <YAxis tick={{ fontSize: 9, fill: G400 }} tickLine={false} axisLine={false} width={22} />
          <Line type="monotone" dataKey="value" stroke={SERIES} strokeWidth={2} dot={{ r: 2.5, fill: "#fff", stroke: SERIES, strokeWidth: 1.5 }} />
        </LineChart>
      </ResponsiveContainer>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
        <div className="grid grid-cols-[70px_1fr_auto] gap-x-2 px-3 py-2 bg-gray-100 text-[10px] text-gray-500 tracking-wider">
          <span>Factor</span>
          <span>Name</span>
          <span className="text-right">Current</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[70px_1fr_auto] gap-x-2 px-3 py-2.5 border-t border-gray-100 items-center">
            <span className="text-xs text-gray-400">{r.factor}</span>
            <div className="min-w-0">
              <p className="text-sm text-gray-800 truncate">{r.name}</p>
              <p className="text-[10px] text-gray-400">
                was {r.prev}{r.unit ? ` ${r.unit}` : ""}
              </p>
            </div>
            <span className="text-sm text-gray-900 tabular-nums flex items-center gap-0.5 justify-end">
              {r.current}
              <ArrowUp size={11} strokeWidth={2.5} className={r.up ? "text-gray-700" : "text-gray-300 rotate-180"} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Diagnostics: Operations bullets, Contact wear, SF₆ ──────────── */
function Bullet({ m }: { m: BulletMetric }) {
  const pct = (v: number) => `${Math.min(100, (v / m.max) * 100)}%`;
  const breach = m.value >= m.alarm ? "alarm" : m.value >= m.warning ? "warn" : "ok";
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm text-gray-700">{m.label}</span>
        <span className={`text-sm tabular-nums ${breach === "alarm" ? "text-gray-900 font-semibold" : "text-gray-600"}`}>
          {m.value.toLocaleString()}
        </span>
      </div>
      <div className="relative h-4 rounded bg-gray-100 overflow-hidden">
        {/* qualitative bands */}
        <div className="absolute top-0 bottom-0 bg-gray-200" style={{ left: pct(m.warning), width: `calc(${pct(m.alarm)} - ${pct(m.warning)})` }} />
        <div className="absolute top-0 bottom-0 bg-gray-300" style={{ left: pct(m.alarm), right: 0 }} />
        {/* measure bar */}
        <div className={`absolute top-1 bottom-1 left-0 rounded-sm ${breach === "alarm" ? "bg-status-critical" : breach === "warn" ? "bg-status-warning" : "bg-chart-line"}`} style={{ width: pct(m.value) }} />
        {/* warning / alarm markers */}
        <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-gray-500" style={{ left: pct(m.warning) }} />
        <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-gray-800" style={{ left: pct(m.alarm) }} />
      </div>
      <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
        <span>0</span>
        <span>warn {m.warning.toLocaleString()}</span>
        <span>alarm {m.alarm.toLocaleString()}</span>
      </div>
    </div>
  );
}

function PhaseChart({
  title,
  unit,
  series,
  lines,
  interval,
}: {
  title: string;
  unit?: string;
  series: PhasePoint[];
  lines: { y: number; label: string; color: string }[];
  interval?: number;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-1.5 mb-1">
        <p className="text-sm font-medium text-gray-700">{title}</p>
        {unit && <span className="text-[10px] text-gray-400">{unit}</span>}
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <LineChart data={series} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="date" interval={interval ?? 2} tick={{ fontSize: 8, fill: G400 }} tickLine={false} axisLine={{ stroke: G200 }} />
          <YAxis tick={{ fontSize: 8, fill: G400 }} tickLine={false} axisLine={false} width={24} />
          {lines.map((l) => (
            <ReferenceLine key={l.label} y={l.y} stroke={l.color} strokeDasharray="4 3" strokeWidth={1.5} />
          ))}
          <Line type="monotone" dataKey="a" stroke={S1} strokeWidth={1.75} dot={false} />
          <Line type="monotone" dataKey="b" stroke={S2} strokeWidth={1.75} dot={false} />
          <Line type="monotone" dataKey="c" stroke={S4} strokeWidth={1.75} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 border-t-2 border-gray-900" /> P1</span>
        <span className="flex items-center gap-1"><span className="w-3 border-t-2 border-gray-500" /> P2</span>
        <span className="flex items-center gap-1"><span className="w-3 border-t-2 border-gray-400" /> P3</span>
        {lines.map((l) => (
          <span key={l.label} className="flex items-center gap-1"><span className="w-3 border-t-2 border-dashed" style={{ borderColor: l.color }} /> {l.label}</span>
        ))}
      </div>
    </div>
  );
}

export function Diagnostics({ d }: { d: AssetDiagnostics }) {
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle>Diagnostics</SectionTitle>

      {/* Operations bullets */}
      <div className="flex flex-col gap-4 -mt-2">
        {d.operations.map((m) => (
          <Bullet key={m.label} m={m} />
        ))}
      </div>

      {/* Contact wear */}
      <PhaseChart
        title="Contact Wear (I²t)"
        unit="%"
        series={d.contactWear.series}
        interval={5}
        lines={[
          { y: d.contactWear.warning, label: "Warning", color: CHART.warning },
          { y: d.contactWear.alert, label: "Alert", color: CHART.alert },
        ]}
      />

      {/* SF6 pressure */}
      {d.sf6Pressure && (
        <PhaseChart
          title="SF₆ Pressure"
          unit={d.sf6Pressure.unit}
          series={d.sf6Pressure.series}
          lines={[
            { y: d.sf6Pressure.informational, label: "Informational", color: G400 },
            { y: d.sf6Pressure.warning, label: "Warning", color: CHART.warning },
          ]}
        />
      )}

      {/* SF6 moisture */}
      {d.sf6Moisture && (
        <PhaseChart
          title="SF₆ Moisture"
          unit={d.sf6Moisture.unit}
          series={d.sf6Moisture.series}
          lines={[
            { y: d.sf6Moisture.warning, label: "Warning", color: CHART.warning },
            { y: d.sf6Moisture.alert, label: "Alert", color: CHART.alert },
          ]}
        />
      )}
    </div>
  );
}
