"use client";

import { useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import { X, LineChart, BarChart3, PieChart, Hash, Check, Plus, Search } from "lucide-react";
import CustomWidgetView from "./sales/custom-widget-view";
import { buildWidget, suggestVisual, type WidgetType, type CustomWidgetConfig } from "@/lib/custom-widget";
import { WIDGET_LIBRARY, WIDGET_CATEGORIES, libraryWidget, type WidgetCategory } from "./widget-library";
import { Button } from "@/components/ui/button";
import { RecommendationActions, RecommendationCard, RecommendationHead } from "./recommendation-card";
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

/* One widget the assistant recommends for each role, and why - shown at the
   top of the library and flagged by the badge on "Add to page". */
const SUGGESTED_BY_ROLE: Record<string, { id: string; reason: string }> = {
  "Project Manager": {
    id: "resource-capacity",
    reason: "Field Service is at 96% utilisation, and crew availability is behind two of your slipping deliveries.",
  },
  Sales: {
    id: "revenue-at-risk",
    reason: "€7.1m of revenue is at risk this quarter, and three of those contracts come up for renewal in your pipeline.",
  },
  Operations: {
    id: "waiting-on",
    reason: "Five items owned by customers and vendors are holding up invoicing on your contracts.",
  },
  "Reliability Engineer": {
    id: "upcoming-servicing",
    reason: "Five inspections are due in the next three weeks - the best chance to verify the scopes you're reviewing.",
  },
  Diagnostics: {
    id: "upcoming-servicing",
    reason: "Upcoming field visits are where you can request fresh readings on the assets awaiting interpretation.",
  },
};

/* Roles whose recommendation has been dismissed this session - shared with the
   customize bar, so dismissing it in either place dismisses it in both. */
const dismissedRecommendations = new Set<string>();

export const dismissWidgetSuggestion = (role: string) => dismissedRecommendations.add(role);
export const isWidgetSuggestionDismissed = (role: string) => dismissedRecommendations.has(role);

/** The recommended widget for a role. */
export function suggestedWidgetFor(role: string) {
  const s = SUGGESTED_BY_ROLE[role] ?? SUGGESTED_BY_ROLE["Project Manager"];
  const widget = libraryWidget(s.id);
  return widget ? { widget, reason: s.reason } : null;
}

/* Every widget is laid out on the same canvas before it is shrunk onto a card.
   Sizing it by span instead made a wide widget letterbox and a tall one tower
   over its neighbours; one canvas means every preview shrinks by the same
   amount and the cards line up. */
const CANVAS = { w: 440, h: 260 };
const PREVIEW_H = 140;

/* A preview is a shape, not a reading: it drops to ink so a row of them reads
   as a set rather than a rainbow. Marks drawn from the theme tokens are
   redefined to ink outright; the rest - chart series carrying their colour as
   a literal - are desaturated, which leaves white and the greys untouched. */
const MONO: React.CSSProperties = {
  filter: "grayscale(1)",
  "--color-chart-line": "#222222",
  "--color-status-critical": "#525252",
  "--color-status-warning": "#8a8a8a",
  "--color-status-ok": "#6b6b6b",
} as React.CSSProperties;

/* A live, shrunk-down render of the real widget. Non-interactive: it is a
   picture of what you are about to add, not a working copy. */
export function WidgetPreview({
  render,
  className = "bg-gray-50",
  bare = false,
}: {
  render: () => ReactNode;
  className?: string;
  /** Drop the preview's own frame, for a preview that already sits in one. */
  bare?: boolean;
}) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w, h } = CANVAS;
  // Framed previews share one height so a grid of them lines up. A bare one
  // takes the canvas's own proportions instead, so the widget fills the frame
  // it has been given rather than sitting in a band of empty space.
  const pad = bare ? 0 : 8;
  const scale = box.w ? Math.min((box.w - pad * 2) / w, (box.h - pad * 2) / h) : 0;

  return (
    <span
      ref={boxRef}
      className={`block overflow-hidden relative ${bare ? "" : `rounded-lg border border-gray-100 ${className}`}`}
      style={bare ? { aspectRatio: `${w} / ${h}` } : { height: PREVIEW_H }}
    >
      {scale > 0 && (
        <span
          aria-hidden
          // A bare preview sits in a frame of its own, so the widget's card -
          // its white fill and border - would be a second frame inside it.
          className={`absolute top-1/2 left-1/2 pointer-events-none select-none [&>*]:h-full ${
            bare ? "[&>*]:bg-transparent [&>*]:border-0" : ""
          }`}
          style={{ width: w, height: h, transform: `translate(-50%, -50%) scale(${scale})`, ...MONO }}
        >
          {render()}
        </span>
      )}
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
  const selectedRole = useAppSelector((s) => s.auth.selectedRole);
  const suggestion = suggestedWidgetFor(selectedRole);
  const q = query.trim().toLowerCase();
  // The suggestion leads the unfiltered library; searching or picking a
  // category means the user is looking for something else.
  const [dismissed, setDismissed] = useState(() => dismissedRecommendations.has(selectedRole));
  const dismiss = () => {
    dismissedRecommendations.add(selectedRole);
    setDismissed(true);
  };
  const showSuggestion = !!suggestion && !dismissed && category === "all" && !q;
  const matches = WIDGET_LIBRARY.filter(
    (w) =>
      (category === "all" || w.category === category) &&
      (!q || w.title.toLowerCase().includes(q) || w.description.toLowerCase().includes(q))
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto no-scrollbar pr-1">
        {showSuggestion && suggestion && (
          <RecommendationCard className="col-span-2">
            <div className="flex flex-1 items-start gap-4">
              <div className="flex-1 min-w-0">
                <RecommendationHead title={suggestion.widget.title}>{suggestion.reason}</RecommendationHead>
              </div>
              <div className="hidden sm:block w-[200px] shrink-0 rounded-md p-2 bg-white">
                <WidgetPreview render={suggestion.widget.render} bare />
              </div>
            </div>
            <RecommendationActions>
              {isOnDashboard(suggestion.widget.id) ? (
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Check size={14} strokeWidth={2} /> On this dashboard
                </span>
              ) : (
                <Button onClick={() => onPick(suggestion.widget.id)} className="rounded-full px-4 cursor-pointer">
                  Add to dashboard
                </Button>
              )}
              <Button onClick={dismiss} variant="ghost" className="rounded-full px-4 cursor-pointer">
                Dismiss
              </Button>
            </RecommendationActions>
          </RecommendationCard>
        )}
        {matches.filter((w) => !showSuggestion || w.id !== suggestion?.widget.id).map((w) => {
          const added = isOnDashboard(w.id);
          return (
            // A div rather than a button: the live preview inside renders the
            // widget's own buttons, and buttons can't nest.
            <div
              key={w.id}
              role="button"
              tabIndex={added ? -1 : 0}
              aria-disabled={added}
              onClick={() => !added && onPick(w.id)}
              onKeyDown={(e) => {
                if (!added && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onPick(w.id);
                }
              }}
              className={`text-left rounded-xl border p-3 flex flex-col gap-2.5 transition-colors ${
                added ? "border-gray-200 bg-gray-50 cursor-default" : "border-gray-200 hover:border-gray-400 cursor-pointer"
              }`}
            >
              <WidgetPreview render={w.render} />
              <span className="flex flex-col gap-1 px-1 pb-0.5">
                <span className="flex items-start justify-between gap-2">
                  <span className="text-sm font-bold text-gray-900 leading-5">{w.title}</span>
                  {added ? (
                    <Check size={15} strokeWidth={2} className="text-gray-500 shrink-0 mt-0.5" />
                  ) : (
                    <Plus size={15} strokeWidth={1.5} className="text-gray-500 shrink-0 mt-0.5" />
                  )}
                </span>
                <span className="text-xs text-gray-500 leading-4">{w.description}</span>
                {added && <span className="text-[10px] text-gray-500">On this dashboard</span>}
              </span>
            </div>
          );
        })}
        {matches.length === 0 && (
          <p className="col-span-2 text-sm text-gray-500 text-center py-10">No widgets match that search.</p>
        )}
      </div>
    </div>
  );
}

/* ── Custom: describe a metric and generate a widget for it ──────── */
function CustomPane({ onAdd }: { onAdd: (config: CustomWidgetConfig) => void }) {
  const selectedRole = useAppSelector((s) => s.auth.selectedRole);
  const examples = examplesFor(selectedRole);
  const [prompt, setPrompt] = useState("");
  // A visual the user picked by hand; null means follow the prompt.
  const [manualType, setManualType] = useState<WidgetType | null>(null);
  // The prompt the preview was generated from; null until the user asks for one.
  const [generated, setGenerated] = useState<string | null>(null);

  const suggested = suggestVisual(prompt || generated || "");
  const type = manualType ?? suggested;

  // Derived, so switching the visual re-renders the preview without an effect.
  const preview = useMemo(
    () => (generated === null ? null : buildWidget(generated, manualType ?? suggestVisual(generated))),
    [generated, manualType]
  );

  // A new prompt picks its own visual again.
  const updatePrompt = (next: string) => {
    setPrompt(next);
    setManualType(null);
  };
  const generate = () => setGenerated(prompt || "Untitled metric");

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Controls - what you want to see first, then how to show it */}
      <div className="flex flex-col gap-5">
        <div>
          <label className="text-xs text-gray-500 mb-2 block">What do you want to see?</label>
          <textarea
            value={prompt}
            onChange={(e) => updatePrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                generate();
              }
            }}
            placeholder={`e.g. ${examples[0]} over the last 6 months`}
            className="w-full h-24 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-500 border border-gray-200 rounded-xl outline-none focus:border-gray-400 resize-none"
            autoFocus
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => {
                  updatePrompt(ex);
                  setGenerated(ex);
                }}
                className="text-xs text-gray-500 border border-gray-200 rounded-full px-2.5 py-1 hover:border-gray-400 transition-colors cursor-pointer"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <label className="text-xs text-gray-500">Visual</label>
            {(prompt || generated) && (
              <span className="text-[11px] text-gray-500">
                {manualType ? (
                  <button onClick={() => setManualType(null)} className="underline underline-offset-2 hover:text-gray-700 cursor-pointer">
                    Use suggested
                  </button>
                ) : (
                  "Recommended by HMAX"
                )}
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {VISUALS.map(({ type: t, label, icon: Icon }) => (
              <button
                key={t}
                onClick={() => setManualType(t === suggested ? null : t)}
                aria-pressed={type === t}
                className={`relative flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs transition-colors cursor-pointer ${
                  type === t ? "border-black bg-gray-50 text-gray-900" : "border-gray-200 text-gray-500 hover:border-gray-400"
                }`}
              >
                {(prompt || generated) && t === suggested && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] px-1.5 py-px rounded-full bg-gray-900 text-white whitespace-nowrap">
                    Recommended
                  </span>
                )}
                <Icon size={18} strokeWidth={1.5} />
                {label}
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
            <p className="text-sm text-gray-500">Describe what you want to see and generate a preview - the visual is picked to fit.</p>
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
      active ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
    }`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-dialog-in">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg text-gray-900 shrink-0">Add to page</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
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
                  className="flex-1 min-w-0 text-sm text-gray-700 placeholder-gray-500 outline-none bg-transparent"
                />
                <Search size={15} strokeWidth={1.5} className="text-gray-500 shrink-0" />
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
