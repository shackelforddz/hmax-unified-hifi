"use client";

import { useState, useEffect, useMemo, type ReactNode } from "react";
import { X, LineChart, BarChart3, PieChart, Hash, Check, Plus, Search } from "lucide-react";
import CustomWidgetView from "./sales/custom-widget-view";
import { buildWidget, type WidgetType, type CustomWidgetConfig } from "@/lib/custom-widget";
import { WIDGET_LIBRARY, WIDGET_CATEGORIES, type WidgetCategory } from "./widget-library";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/hooks";

const VISUALS: { type: WidgetType; label: string; icon: typeof LineChart }[] = [
  { type: "line", label: "Line", icon: LineChart },
  { type: "bar", label: "Bar", icon: BarChart3 },
  { type: "donut", label: "Donut", icon: PieChart },
  { type: "kpi", label: "KPI", icon: Hash },
];

// Example prompts tuned to what each role actually tracks.
const EXAMPLES_BY_ROLE: Record<string, string[]> = {
  "Project Manager": ["On-time delivery trend", "Revenue at risk by trigger", "Milestones due by week", "Vendor concentration"],
  Sales: ["Pipeline value trend", "Weighted forecast by stage", "SLA renewals by month", "Leads by stage"],
  Operations: ["Portfolio margin trend", "Contract status breakdown", "Resource utilisation by team", "Change orders by value"],
  "Reliability Engineer": ["Fleet health over time", "Assets by review type", "Scope feasibility outcomes", "Site constraints by type"],
  Diagnostics: ["Reports awaiting interpretation", "Fault signatures by asset", "Field-report turnaround", "DGA trends by unit"],
};

function examplesFor(role: string): string[] {
  return EXAMPLES_BY_ROLE[role] ?? EXAMPLES_BY_ROLE["Project Manager"];
}

/** How far down a real widget is shrunk to sit on a library card. */
const SCALE = 0.34;

/* A live, shrunk-down render of the real widget. Non-interactive: it is a
   picture of what you are about to add, not a working copy. */
function Preview({ render }: { render: () => ReactNode }) {
  return (
    <span className="block h-[124px] rounded-lg bg-gray-50 border border-gray-100 overflow-hidden relative">
      {/* 1/scale wide, so the shrunk widget lands exactly at card width */}
      <span
        aria-hidden
        className="absolute top-0 left-0 origin-top-left pointer-events-none select-none"
        style={{ width: `${100 / SCALE}%`, transform: `scale(${SCALE})` }}
      >
        {render()}
      </span>
    </span>
  );
}

/* ── Library: pick one of the widgets the product already ships ──── */
function LibraryPane({
  category,
  query,
  onPick,
  isOnDashboard,
}: {
  category: WidgetCategory | "all";
  query: string;
  onPick: (id: string) => void;
  isOnDashboard: (id: string) => boolean;
}) {
  const q = query.trim().toLowerCase();
  const matches = WIDGET_LIBRARY.filter(
    (w) =>
      (category === "all" || w.category === category) &&
      (!q || w.title.toLowerCase().includes(q) || w.description.toLowerCase().includes(q))
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto no-scrollbar pr-1">
        {matches.map((w) => {
          const added = isOnDashboard(w.id);
          return (
            <button
              key={w.id}
              onClick={() => !added && onPick(w.id)}
              disabled={added}
              className={`text-left rounded-xl border p-3 flex flex-col gap-2.5 transition-colors ${
                added ? "border-gray-200 bg-gray-50 cursor-default" : "border-gray-200 hover:border-gray-400 cursor-pointer"
              }`}
            >
              <Preview render={w.render} />
              <span className="flex flex-col gap-1 px-1 pb-0.5">
                <span className="flex items-start justify-between gap-2">
                  <span className="text-sm font-bold text-gray-900 leading-5">{w.title}</span>
                  {added ? (
                    <Check size={15} strokeWidth={2} className="text-gray-400 shrink-0 mt-0.5" />
                  ) : (
                    <Plus size={15} strokeWidth={1.5} className="text-gray-400 shrink-0 mt-0.5" />
                  )}
                </span>
                <span className="text-xs text-gray-500 leading-4">{w.description}</span>
                {added && <span className="text-[10px] text-gray-400">On this dashboard</span>}
              </span>
            </button>
          );
        })}
        {matches.length === 0 && (
          <p className="col-span-2 text-sm text-gray-400 text-center py-10">No widgets match that search.</p>
        )}
      </div>
    </div>
  );
}

/* ── Custom: describe a metric and generate a widget for it ──────── */
function CustomPane({ onAdd }: { onAdd: (config: CustomWidgetConfig) => void }) {
  const selectedRole = useAppSelector((s) => s.auth.selectedRole);
  const examples = examplesFor(selectedRole);
  const [type, setType] = useState<WidgetType>("line");
  const [prompt, setPrompt] = useState("");
  // The prompt the preview was generated from; null until the user asks for one.
  const [generated, setGenerated] = useState<string | null>(null);

  // Derived, so switching the visual re-renders the preview without an effect.
  const preview = useMemo(() => (generated === null ? null : buildWidget(generated, type)), [generated, type]);

  const generate = () => setGenerated(prompt || "Untitled metric");

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Controls */}
      <div className="flex flex-col gap-5">
        <div>
          <label className="text-xs text-gray-500 mb-2 block">Visual</label>
          <div className="grid grid-cols-4 gap-2">
            {VISUALS.map(({ type: t, label, icon: Icon }) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs transition-colors cursor-pointer ${
                  type === t ? "border-black bg-gray-50 text-gray-900" : "border-gray-200 text-gray-500 hover:border-gray-400"
                }`}
              >
                <Icon size={18} strokeWidth={1.5} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-2 block">What do you want to see?</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`e.g. ${examples[0]} over the last 6 months`}
            className="w-full h-24 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 border border-gray-200 rounded-xl outline-none focus:border-gray-400 resize-none"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => setPrompt(ex)}
                className="text-xs text-gray-500 border border-gray-200 rounded-full px-2.5 py-1 hover:border-gray-400 transition-colors cursor-pointer"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={generate} className="rounded-full h-auto px-5 py-2.5 text-sm text-gray-700 cursor-pointer">
            {preview ? "Regenerate preview" : "Generate preview"}
          </Button>
          <Button
            onClick={() => preview && onAdd(preview)}
            disabled={!preview}
            className="rounded-full h-auto px-5 py-2.5 text-sm cursor-pointer"
          >
            Add to dashboard
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div>
        <label className="text-xs text-gray-500 mb-2 block">Preview</label>
        {preview ? (
          <div className="bg-gray-50 rounded-xl p-3">
            <CustomWidgetView config={preview} static />
          </div>
        ) : (
          <div className="h-[240px] border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-center px-6">
            <p className="text-sm text-gray-400">Choose a visual and describe your data, then generate a preview.</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  /** Library ids already on this dashboard, so they read as added. */
  onDashboard: string[];
  onAddLibrary: (id: string) => void;
  onAddCustom: (config: CustomWidgetConfig) => void;
  onClose: () => void;
}

export default function AddWidgetDialog({ onDashboard, onAddLibrary, onAddCustom, onClose }: Props) {
  // "Custom" sits alongside the library categories - picking it swaps the body
  // for the builder, so there is one row of choices rather than two.
  const [category, setCategory] = useState<WidgetCategory | "all" | "Custom">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const tab = (active: boolean) =>
    `h-full flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
      active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
    }`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-message-in">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg text-gray-900 shrink-0">Add widget</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          {/* Filters - categories left, search right, on one line */}
          <div className="flex items-center justify-between gap-4">
          <div
            role="tablist"
            aria-label="Widget category"
            className="bg-gray-100 h-8 flex items-center p-[3px] rounded-full overflow-x-auto no-scrollbar shrink-0"
          >
            <button role="tab" aria-selected={category === "all"} onClick={() => setCategory("all")} className={tab(category === "all")}>
              All
            </button>
            {WIDGET_CATEGORIES.map((c) => (
              <button key={c} role="tab" aria-selected={category === c} onClick={() => setCategory(c)} className={tab(category === c)}>
                {c}
              </button>
            ))}
            <button role="tab" aria-selected={category === "Custom"} onClick={() => setCategory("Custom")} className={tab(category === "Custom")}>
              Custom
            </button>
          </div>

            {/* Nothing to search through on the custom tab */}
            {category !== "Custom" && (
              <div className="flex items-center gap-1.5 h-8 px-2.5 py-1.5 bg-white border border-gray-200 rounded-full w-[220px] shrink-0">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search widgets"
                  aria-label="Search widgets"
                  className="flex-1 min-w-0 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
                />
                <Search size={15} strokeWidth={1.5} className="text-gray-400 shrink-0" />
              </div>
            )}
          </div>

          {category === "Custom" ? (
            <CustomPane onAdd={onAddCustom} />
          ) : (
            <LibraryPane category={category} query={query} onPick={onAddLibrary} isOnDashboard={(id) => onDashboard.includes(id)} />
          )}
        </div>
      </div>
    </div>
  );
}
