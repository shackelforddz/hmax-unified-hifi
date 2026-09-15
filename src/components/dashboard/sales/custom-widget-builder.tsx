"use client";

import { useState, useEffect } from "react";
import { X, LineChart, BarChart3, PieChart, Hash } from "lucide-react";
import CustomWidgetView from "./custom-widget-view";
import { buildWidget, type WidgetType, type CustomWidgetConfig } from "@/lib/custom-widget";
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

interface Props {
  onAdd: (config: CustomWidgetConfig) => void;
  onClose: () => void;
}

export default function CustomWidgetBuilder({ onAdd, onClose }: Props) {
  const selectedRole = useAppSelector((s) => s.auth.selectedRole);
  const examples = examplesFor(selectedRole);
  const [type, setType] = useState<WidgetType>("line");
  const [prompt, setPrompt] = useState("");
  const [preview, setPreview] = useState<CustomWidgetConfig | null>(null);

  const generate = () => setPreview(buildWidget(prompt || "Untitled metric", type));

  // Keep the preview in sync with the chosen visual once one exists (editing).
  useEffect(() => {
    if (preview) setPreview(buildWidget(prompt || "Untitled metric", type));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const add = () => onAdd(preview ?? buildWidget(prompt || "Untitled metric", type));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 font-patrick-hand">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-message-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg text-gray-900">Create a custom widget</h2>
            <p className="text-sm text-gray-400">Pick a visual, describe the data, and preview it.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-2 gap-6 p-6">
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
                className="w-full h-24 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 border border-gray-200 rounded-lg outline-none focus:border-gray-400 resize-none"
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

            <Button onClick={generate} className="self-start rounded-full h-auto px-5 py-2.5 text-sm cursor-pointer">
              {preview ? "Regenerate preview" : "Generate preview"}
            </Button>
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
                <p className="text-sm text-gray-400">
                  Choose a visual and describe your data, then generate a preview.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} className="rounded-full h-auto px-5 py-2 text-sm text-gray-600 cursor-pointer">
            Cancel
          </Button>
          <Button onClick={add} disabled={!preview} className="rounded-full h-auto px-5 py-2 text-sm cursor-pointer">
            Add to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
