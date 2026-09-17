"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHART } from "@/lib/chart-theme";

export interface DocTable {
  columns: string[];
  rows: string[][];
}
export interface DocChart {
  unit?: string;
  threshold?: number;
  points: { label: string; value: number }[];
}
export interface DocSection {
  heading: string;
  text?: string;
  table?: DocTable;
  chart?: DocChart;
}

export interface ViewDoc {
  kind: "drawing" | "report" | "work-order" | "contract";
  docType: string; // e.g. "Single-line diagram", "Field report"
  title: string;
  ref: string;
  fields: { label: string; value: string }[];
  sections: DocSection[];
  preview: "drawing" | "text";
  /** Optional inspection photos (multi-media reports). */
  images?: { caption: string }[];
}

/* Simple greyscale trend chart for report data. */
function DocChartView({ chart }: { chart: DocChart }) {
  const { points, threshold } = chart;
  const w = 560, h = 120, pad = 10;
  const vals = points.map((p) => p.value);
  const max = Math.max(...vals, threshold ?? -Infinity);
  const min = Math.min(...vals, threshold ?? Infinity, 0);
  const span = max - min || 1;
  const x = (i: number) => pad + (i * (w - 2 * pad)) / Math.max(1, points.length - 1);
  const y = (v: number) => h - pad - ((v - min) / span) * (h - 2 * pad);
  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ");
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28">
        {threshold != null && (
          <line x1={pad} x2={w - pad} y1={y(threshold)} y2={y(threshold)} stroke="#A3A3A3" strokeDasharray="4 3" strokeWidth={1} />
        )}
        <polygon points={area} fill="#1717711" fillOpacity={0.08} />
        <polyline points={line} fill="none" stroke={CHART.line} strokeWidth={2} />
        {points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.value)} r={2.5} fill={CHART.line} />)}
      </svg>
      <div className="flex justify-between text-[10px] text-gray-400 px-1">
        {points.map((p) => <span key={p.label}>{p.label}</span>)}
        {threshold != null && <span className="text-gray-400">limit {threshold}{chart.unit ? ` ${chart.unit}` : ""}</span>}
      </div>
    </div>
  );
}

function badgeCls(v: string): string {
  const s = v.toLowerCase();
  if (/(alert|fail|over|breach)/.test(s)) return "bg-gray-900 text-white";
  if (/(watch|in progress|pending|open)/.test(s)) return "bg-gray-200 text-gray-700";
  if (/(pass|normal|closed|ok|resolved)/.test(s)) return "border border-gray-300 text-gray-500";
  return "";
}

function DocTableView({ table }: { table: DocTable }) {
  const cols = table.columns.length;
  const template = `1.6fr ${"1fr ".repeat(Math.max(0, cols - 1)).trim()}`;
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="grid" style={{ gridTemplateColumns: template }}>
        {table.columns.map((c) => (
          <div key={c} className="text-[11px] text-gray-400 px-3 py-2 bg-gray-50 border-b border-gray-200">{c}</div>
        ))}
        {table.rows.map((row, ri) =>
          row.map((cell, ci) => {
            const last = ci === cols - 1;
            const b = last ? badgeCls(cell) : "";
            return (
              <div key={`${ri}-${ci}`} className={`text-sm px-3 py-2 border-b border-gray-100 last:border-0 ${ci === 0 ? "text-gray-800" : "text-gray-600"}`}>
                {b ? <span className={`text-[10px] px-2 py-0.5 rounded-full ${b}`}>{cell}</span> : cell}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* A stylised single-line diagram so drawings render as an engineering sheet. */
function DrawingCanvas({ doc }: { doc: ViewDoc }) {
  return (
    <div className="border border-gray-300 bg-white">
      {/* Drawing area */}
      <div className="relative aspect-[4/3] bg-[repeating-linear-gradient(0deg,#fafafa,#fafafa_23px,#f0f0f0_24px),repeating-linear-gradient(90deg,#fafafa,#fafafa_23px,#f0f0f0_24px)]">
        <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full" stroke="#171717" fill="none" strokeWidth={1.5}>
          {/* Incoming bus */}
          <line x1="200" y1="20" x2="200" y2="55" />
          <line x1="140" y1="55" x2="260" y2="55" strokeWidth={3} />
          {/* Disconnect */}
          <line x1="200" y1="55" x2="200" y2="80" />
          <line x1="200" y1="80" x2="215" y2="98" />
          <circle cx="200" cy="80" r="2.5" fill="#171717" />
          {/* Breaker */}
          <rect x="192" y="102" width="16" height="16" />
          <line x1="200" y1="118" x2="200" y2="140" />
          {/* Transformer (two coupled windings) */}
          <circle cx="200" cy="158" r="18" />
          <circle cx="200" cy="182" r="18" />
          <line x1="200" y1="200" x2="200" y2="225" />
          {/* Outgoing bus */}
          <line x1="140" y1="225" x2="260" y2="225" strokeWidth={3} />
          <line x1="160" y1="225" x2="160" y2="250" />
          <line x1="240" y1="225" x2="240" y2="250" />
          {/* Feeder breakers */}
          <rect x="152" y="250" width="16" height="16" />
          <rect x="232" y="250" width="16" height="16" />
          {/* Labels */}
          <text x="266" y="58" fontSize="9" fill="#737373" stroke="none">HV BUS</text>
          <text x="222" y="172" fontSize="9" fill="#737373" stroke="none">TX</text>
          <text x="266" y="228" fontSize="9" fill="#737373" stroke="none">LV BUS</text>
        </svg>
      </div>
      {/* Title block */}
      <div className="grid grid-cols-4 border-t border-gray-300 text-[10px]">
        {[
          { l: "Drawing no.", v: doc.ref },
          { l: "Title", v: doc.title },
          ...doc.fields.slice(0, 2).map((f) => ({ l: f.label, v: f.value })),
        ].map((c, i) => (
          <div key={i} className={`px-3 py-2 ${i < 3 ? "border-r border-gray-300" : ""}`}>
            <p className="text-gray-400 tracking-wider">{c.l}</p>
            <p className="text-gray-800 mt-0.5 truncate">{c.v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* The document itself - reused in the modal viewer and inline in the chat. */
export function DocContent({ doc }: { doc: ViewDoc }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-5">
      {/* Document header band */}
      <div className="flex items-start justify-between border-b border-gray-100 pb-4">
        <div>
          <p className="text-sm text-gray-900">Hitachi Energy</p>
          <p className="text-xs text-gray-400 mt-0.5">{doc.docType}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 tracking-wider">Reference</p>
          <p className="text-sm text-gray-800 mt-0.5">{doc.ref}</p>
        </div>
      </div>

      {/* Drawing preview */}
      {doc.preview === "drawing" && <DrawingCanvas doc={doc} />}

      {/* Title-block / metadata fields */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {doc.fields.map((f) => (
          <div key={f.label}>
            <p className="text-[11px] text-gray-400 tracking-wider">{f.label}</p>
            <p className="text-sm text-gray-800 mt-0.5">{f.value}</p>
          </div>
        ))}
      </div>

      {/* Narrative sections - text, tables and charts */}
      {doc.sections.map((s) => (
        <div key={s.heading} className="flex flex-col gap-2.5">
          <p className="text-[11px] text-gray-400 tracking-wider">{s.heading}</p>
          {s.text && <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{s.text}</p>}
          {s.chart && <DocChartView chart={s.chart} />}
          {s.table && <DocTableView table={s.table} />}
        </div>
      ))}

      {/* Inspection photos */}
      {doc.images && doc.images.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <p className="text-[11px] text-gray-400 tracking-wider">Photos</p>
          <div className="grid grid-cols-3 gap-2">
            {doc.images.map((img) => (
              <div key={img.caption} className="flex flex-col gap-1">
                <div className="aspect-[4/3] rounded-md bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/transformer.png" alt={img.caption} className="w-full h-full object-cover grayscale" />
                </div>
                <p className="text-[10px] text-gray-400 leading-tight">{img.caption}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* The same document, with its fields and written sections editable in
   place. Tables, charts and photos are data, so they stay read-only. */
export function DocEditor({ doc, onSave, onCancel }: { doc: ViewDoc; onSave: (doc: ViewDoc) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<ViewDoc>(doc);

  const setField = (i: number, value: string) =>
    setDraft((d) => ({ ...d, fields: d.fields.map((f, j) => (j === i ? { ...f, value } : f)) }));
  const setSection = (i: number, text: string) =>
    setDraft((d) => ({ ...d, sections: d.sections.map((s, j) => (j === i ? { ...s, text } : s)) }));

  const input = "w-full px-3 py-1.5 text-sm text-gray-800 border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white";

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-5 flex flex-col gap-5">
      <div className="flex items-start justify-between border-b border-gray-100 pb-4">
        <div>
          <p className="text-sm text-gray-900">Hitachi Energy</p>
          <p className="text-xs text-gray-400 mt-0.5">{draft.docType} · editing</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 tracking-wider">Reference</p>
          <p className="text-sm text-gray-800 mt-0.5">{draft.ref}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {draft.fields.map((f, i) => (
          <label key={f.label} className="block">
            <span className="block text-[11px] text-gray-400 tracking-wider mb-1">{f.label}</span>
            <input value={f.value} onChange={(e) => setField(i, e.target.value)} className={input} />
          </label>
        ))}
      </div>

      {draft.sections.map((s, i) => (
        <div key={s.heading} className="flex flex-col gap-2.5">
          <p className="text-[11px] text-gray-400 tracking-wider">{s.heading}</p>
          {s.text !== undefined && (
            <textarea
              value={s.text}
              onChange={(e) => setSection(i, e.target.value)}
              rows={Math.max(3, Math.ceil(s.text.length / 70))}
              className={`${input} leading-relaxed resize-y`}
            />
          )}
          {s.chart && <DocChartView chart={s.chart} />}
          {s.table && <DocTableView table={s.table} />}
        </div>
      ))}

      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
        <Button variant="outline" onClick={onCancel} className="rounded-full h-auto px-4 py-1.5 text-xs text-gray-700 cursor-pointer">
          Cancel
        </Button>
        <Button onClick={() => onSave(draft)} className="rounded-full h-auto px-4 py-1.5 text-xs cursor-pointer">
          Save changes
        </Button>
      </div>
    </div>
  );
}

interface Props {
  doc: ViewDoc | null;
  onClose: () => void;
  onAsk: (doc: ViewDoc) => void;
}

export default function DocumentViewer({ doc, onClose, onAsk }: Props) {
  const open = !!doc;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!doc) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/40 animate-in fade-in" />

      {/* Document sheet */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[760px] max-h-[90vh] flex flex-col overflow-hidden animate-message-in">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <p className="text-[11px] text-gray-400 tracking-wider">{doc.docType}</p>
            <h2 className="text-xl text-gray-900 truncate">{doc.title}</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => window.print()}
              aria-label="Download"
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Download size={16} />
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body - the document itself */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 bg-gray-50">
          <DocContent doc={doc} />
        </div>

        {/* Footer */}
        <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-gray-100">
          <Button
            onClick={() => onAsk(doc)}
            className="flex-1 rounded-full h-auto py-2.5 text-sm cursor-pointer gap-2"
          >
            Ask about this document
          </Button>
        </div>
      </div>
    </div>
  );
}
