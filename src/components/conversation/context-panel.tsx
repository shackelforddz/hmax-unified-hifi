"use client";

import { useState } from "react";
import { customerSummary } from "@/lib/knowledge-base";

const TABS = ["Summary", "Documents", "History"];

const SEGMENTS = [
  { pct: 0.44, color: "#E5E5E5" }, // Healthy
  { pct: 0.31, color: "#A3A3A3" }, // Average
  { pct: 0.25, color: "#171717" }, // Poor
];

function DonutChart() {
  const r = 60;
  const cx = 80;
  const cy = 80;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      {SEGMENTS.map((seg, i) => {
        const dashLen = circ * seg.pct;
        const el = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="20"
            strokeDasharray={`${dashLen} ${circ - dashLen}`}
            strokeDashoffset={-offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }}
          />
        );
        offset += dashLen;
        return el;
      })}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="26" fontFamily="inherit" fill="#171717" fontWeight="600">
        1125
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fontFamily="inherit" fill="#A3A3A3">
        Assets
      </text>
    </svg>
  );
}

const LOCATIONS = [
  { city: "Milan, Italy", count: 845, max: 1000 },
  { city: "Venice, Italy", count: 280, max: 1000 },
];

const CASE_SUMMARY = [
  "Xcel Energy plans to sign a 5-year HVDC SLA for 9 converter stations in North America, valued at $4.2M. This is Hitachi Energy's largest SLA in the West. Procurement lead Dan Hoffmann requested an offer by 30 September 2026.",
  "The lead arose from a July 2026 service visit where recurring partial discharge on Unit S-12 was noted, similar to issues in November 2025 and March 2026. This, along with DGA trends on Unit S-11 and aging units, sparked discussions. The strong relationship with Xcel and evidence of asset issues indicate high confidence, with operational risks being the main concern.",
];

export default function ContextPanel({ customer }: { customer?: string }) {
  const [tab, setTab] = useState("Summary");
  const name = customer ?? "Xcel Energy";
  const isXcel = name.toLowerCase() === "xcel energy";
  const summary = isXcel ? CASE_SUMMARY : [customerSummary(name) ?? CASE_SUMMARY[0]];

  return (
    <div className="w-[420px] h-full shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-10 pb-5">
        <h1 className="text-2xl text-gray-900 text-center">{name}</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm text-center border-b-2 transition-colors cursor-pointer ${
              tab === t
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-7 no-scrollbar">
        {/* Asset Breakdown */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-4">Asset Breakdown</p>
          <div className="flex justify-center">
            <DonutChart />
          </div>
          <div className="flex justify-center gap-5 mt-4">
            {[
              { color: "bg-gray-200", label: "Healthy" },
              { color: "bg-gray-400", label: "Average" },
              { color: "bg-gray-900", label: "Poor" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-4">Locations</p>
          <div className="flex flex-col gap-4">
            {LOCATIONS.map(({ city, count, max }) => (
              <div key={city}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm text-gray-600">{city}</span>
                  <span className="text-sm text-gray-400">{count}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-900 rounded-full"
                    style={{ width: `${(count / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Case Summary */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Case Summary</p>
          {summary.map((para, i) => (
            <p key={i} className={`text-sm text-gray-500 leading-relaxed ${i > 0 ? "mt-3" : ""}`}>
              {para}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
