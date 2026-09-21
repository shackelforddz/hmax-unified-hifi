"use client";

import { ChevronDown } from "lucide-react";

/** Sentinel for the "no filter" option on a <Select>. */
export const ALL = "__all__";

/* ── Filter tabs ─────────────────────────────────────────────────── */
export function TabGroup({
  value,
  onChange,
  options,
  countFor,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  countFor: (v: string) => number;
  label: string;
}) {
  const tab = (active: boolean) =>
    `h-full flex gap-1.5 items-center justify-center px-2 py-1 rounded-full text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
      active ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
    }`;

  return (
    <div
      role="tablist"
      aria-label={label}
      className="bg-gray-100 h-8 flex items-center p-[3px] rounded-full overflow-x-auto no-scrollbar shrink-0"
    >
      <button role="tab" aria-selected={value === "all"} onClick={() => onChange("all")} className={tab(value === "all")}>
        All
      </button>
      {options.map((o) => (
        <button key={o} role="tab" aria-selected={value === o} onClick={() => onChange(o)} className={tab(value === o)}>
          {o}
          <span className="h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-gray-500/30 text-xs text-gray-900">
            {countFor(o)}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ── Filter select ───────────────────────────────────────────────── */
export function Select({
  value,
  onChange,
  allLabel,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  options: string[];
  label: string;
}) {
  return (
    <div className="relative shrink-0 w-[157px]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="appearance-none w-full h-8 pl-2.5 pr-8 py-1 text-sm text-gray-500 bg-white border border-gray-200 rounded-full outline-none focus:border-gray-400 cursor-pointer truncate"
      >
        <option value={ALL}>{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        strokeWidth={1.5}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
      />
    </div>
  );
}
