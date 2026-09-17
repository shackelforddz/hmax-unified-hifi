/* ── Custom widget builder model ─────────────────────────────────── */

export type WidgetType = "line" | "bar" | "donut" | "kpi";

export interface WidgetPoint {
  label: string;
  value: number;
}

export interface CustomWidgetConfig {
  id: string;
  title: string;
  type: WidgetType;
  series: WidgetPoint[];
  unit?: string; // "%" | "€M" | undefined
}

const MONTHS = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Map a free-text prompt to a plausible, grounded dataset.
export function buildSeries(prompt: string): { series: WidgetPoint[]; unit?: string } {
  const q = prompt.toLowerCase();

  if (/margin/.test(q))
    return { series: MONTHS.map((m, i) => ({ label: m, value: [19.4, 19.0, 18.9, 18.7, 18.6, 18.6][i] })), unit: "%" };
  if (/(on.?time|delivery|cotd)/.test(q))
    return { series: MONTHS.map((m, i) => ({ label: m, value: [78, 74, 70, 68, 64, 60][i] })), unit: "%" };
  if (/(revenue|invoice|risk\b)/.test(q))
    return {
      series: [
        { label: "Delivery slip", value: 4.8 },
        { label: "Invoice blocked", value: 1.2 },
        { label: "Change order", value: 0.7 },
        { label: "Scope creep", value: 0.4 },
      ],
      unit: "€M",
    };
  if (/(vendor|supplier|concentration)/.test(q))
    return {
      series: [
        { label: "Delta Coils", value: 4.8 },
        { label: "Nexans", value: 1.4 },
        { label: "Nynas AB", value: 0.6 },
        { label: "Air Liquide", value: 0.3 },
      ],
      unit: "€M",
    };
  if (/(fleet|health|score)/.test(q))
    return { series: MONTHS.map((m, i) => ({ label: m, value: [83, 86, 80, 68, 72, 71][i] })) };
  if (/(renewal|sla|pipeline)/.test(q))
    return { series: MONTHS.map((m, i) => ({ label: m, value: [8, 9, 11, 12, 12, 12][i] })) };
  if (/(asset|critical|repair|condition)/.test(q))
    return {
      series: [
        { label: "Healthy", value: 14 },
        { label: "At risk", value: 3 },
        { label: "Critical", value: 2 },
      ],
    };
  if (/(contract|portfolio|account|pipeline)/.test(q))
    return {
      series: [
        { label: "In execution", value: 10 },
        { label: "At risk", value: 8 },
        { label: "On hold", value: 4 },
        { label: "Closing", value: 2 },
      ],
    };

  // Deterministic fallback so the preview is stable for a given prompt
  const seed = hash(q || "data");
  return { series: MONTHS.map((m, i) => ({ label: m, value: 20 + ((seed >> (i * 3)) & 31) })) };
}

/** The visual that best fits what the prompt is asking for: a trend reads as
 *  a line, a share-of-whole as a donut, a single figure as a KPI, and a
 *  comparison across things as bars. Falls back to the shape of the data. */
export function suggestVisual(prompt: string): WidgetType {
  const q = prompt.toLowerCase();
  if (!q.trim()) return "line";
  if (/\b(trends?|over time|history|monthly|by month|by week|weekly|growth|since|last \d+ (months|weeks)|over the last)\b/.test(q)) return "line";
  if (/\b(breakdown|split|share|mix|proportion|distribution|composition|status|concentration|outcomes?)\b/.test(q)) return "donut";
  if (/\b(how many|total|count|number of|current|today|average|kpi|overall|awaiting|outstanding)\b/.test(q)) return "kpi";
  if (/\b(by|per|compare|comparison|top|rank|ranking|versus|vs)\b/.test(q)) return "bar";

  // Nothing explicit - let the data decide.
  const { series } = buildSeries(prompt);
  const overTime = series.every((p) => MONTHS.includes(p.label));
  if (overTime) return "line";
  return series.length <= 3 ? "donut" : "bar";
}

function titleFrom(prompt: string): string {
  const t = prompt.trim();
  if (!t) return "Custom widget";
  const clean = t.replace(/[?.!]+$/, "");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function buildWidget(prompt: string, type: WidgetType): CustomWidgetConfig {
  const { series, unit } = buildSeries(prompt);
  return { id: `cw-${Date.now()}`, title: titleFrom(prompt), type, series, unit };
}

export function formatValue(v: number, unit?: string): string {
  if (unit === "%") return `${v}%`;
  if (unit === "€M") return `€${v}M`;
  return `${v}`;
}
