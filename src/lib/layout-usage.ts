/* ── Widget usage & the recommended layout ───────────────────────────
   Counts how often each widget on a dashboard is interacted with, so
   Reorganize can recommend a layout that puts the most-used widgets first.
   Counts start from a seeded 30-day history per dashboard and every click
   inside a widget adds to them. */

const KEY = (dashboard: string) => `hmax:usage:${dashboard}`;

/** Seeded interaction counts over the last 30 days. */
const SEED: Record<string, Record<string, number>> = {
  pm: { attention: 48, "waiting-on": 31, "delivery-map": 27, servicing: 19, "delivery-trend": 11, "revenue-at-risk": 8, people: 5 },
  operations: {
    "contracts-attention": 52,
    "resource-capacity": 34,
    "field-engineers": 26,
    "fleet-map": 21,
    "upcoming-servicing": 15,
    "delivery-trend": 12,
    financial: 9,
    "revenue-timing": 7,
    "response-time": 5,
    "assets-monitored": 3,
  },
  sales: { renewals: 46, "new-leads": 39, "asset-alerts": 22, "fleet-map": 18, "sales-team": 14, financial: 10, "revenue-timing": 6, "fleet-health": 5, "assets-monitored": 3 },
  reliability: { "scope-reviews": 41, "assets-to-review": 37, "fleet-map": 20, "fleet-health": 9, "assets-monitored": 4 },
  diagnostics: { "reports-to-review": 44, "field-engineers": 23, "fleet-map": 19, "fleet-health": 8, "assets-monitored": 5 },
};

/** Readable names for the widgets a recommendation talks about. */
const NAMES: Record<string, string> = {
  // The KPI strip each dashboard opens with.
  kpis: "KPIs",
  "portfolio-health": "KPIs",
  "lead-stats": "KPIs",
  attention: "Contracts that need your attention",
  "contracts-attention": "Contracts needing attention",
  "waiting-on": "Waiting on",
  "delivery-map": "Delivery map",
  "fleet-map": "Map",
  servicing: "Upcoming servicing",
  "upcoming-servicing": "Upcoming servicing",
  "delivery-trend": "Delivery performance",
  "revenue-at-risk": "Revenue at risk",
  "revenue-by-vendor": "Revenue at risk by vendor",
  people: "People",
  "resource-capacity": "Resource & Capacity",
  "field-engineers": "Field engineers",
  financial: "Financial Performance",
  "revenue-timing": "Revenue & timing",
  "response-time": "Response time",
  "assets-monitored": "Assets monitored",
  renewals: "Renewals",
  "new-leads": "New leads",
  "asset-alerts": "Asset alerts",
  "sales-team": "Sales team",
  "fleet-health": "Average Asset Health",
  "scope-reviews": "Contracts to review",
  "assets-to-review": "Assets to review",
  "reports-to-review": "Asset reports to review",
};

export const widgetName = (id: string) => NAMES[id] ?? id;

function readLocal(dashboard: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(KEY(dashboard));
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** Seeded history plus interactions recorded in this browser. */
export function usageFor(dashboard: string): Record<string, number> {
  const seed = SEED[dashboard] ?? {};
  const local = readLocal(dashboard);
  const out: Record<string, number> = { ...seed };
  for (const [id, n] of Object.entries(local)) out[id] = (out[id] ?? 0) + n;
  return out;
}

export function recordInteraction(dashboard: string, widgetId: string) {
  try {
    const local = readLocal(dashboard);
    local[widgetId] = (local[widgetId] ?? 0) + 1;
    localStorage.setItem(KEY(dashboard), JSON.stringify(local));
  } catch {
    /* private browsing / blocked storage - usage just won't accumulate */
  }
}

export interface LayoutSize {
  span: number;
  rows?: number;
}

export interface LayoutItem {
  id: string;
  span: number;
  rows?: number;
  tile?: boolean;
}

/** A recommended layout: the widget order plus the size each widget takes. */
export interface RecommendedLayout {
  order: string[];
  sizes: Record<string, LayoutSize>;
}

/* Full-width widgets are lists and strips that only read well across the
   whole dashboard; everything else is a tile that can sit beside others. */
const isFull = (it: LayoutItem) => it.span >= 12 || !it.tile;
const isMap = (it: LayoutItem) => it.id.endsWith("map");

/** Split a run of tiles into rows of three or two, never leaving one alone. */
function packTiles(run: LayoutItem[], out: { id: string; size: LayoutSize }[]) {
  let rest = run;
  while (rest.length) {
    const take = rest.length === 1 ? 1 : rest.length === 2 || rest.length === 4 ? 2 : 3;
    const span = 12 / take;
    rest.slice(0, take).forEach((it) => out.push({ id: it.id, size: { span } }));
    rest = rest.slice(take);
  }
}

/** A run of tiles, with any map given its own two-row block and the tiles
 *  either side stacked beside it. */
function packRun(run: LayoutItem[], out: { id: string; size: LayoutSize }[]) {
  const m = run.findIndex(isMap);
  if (m === -1) return packTiles(run, out);

  let before = run.slice(0, m);
  let after = run.slice(m + 1);
  // A single tile ahead of the map would sit alone - it partners the map instead.
  const lead = before.length === 1 ? before : [];
  if (lead.length) before = [];
  packTiles(before, out);

  const partners = [...lead, ...after.slice(0, 2 - lead.length).filter((it) => !isMap(it))];
  after = after.filter((it) => !partners.includes(it));
  const map = run[m];

  if (partners.length === 2) {
    // Map across two rows, the two tiles stacked beside it - in rank order.
    if (lead.length) {
      out.push({ id: partners[0].id, size: { span: 4 } });
      out.push({ id: map.id, size: { span: 8, rows: 2 } });
      out.push({ id: partners[1].id, size: { span: 4 } });
    } else {
      out.push({ id: map.id, size: { span: 8, rows: 2 } });
      partners.forEach((it) => out.push({ id: it.id, size: { span: 4 } }));
    }
  } else if (partners.length === 1) {
    if (lead.length) out.push({ id: partners[0].id, size: { span: 4 } });
    out.push({ id: map.id, size: { span: 8 } });
    if (!lead.length) out.push({ id: partners[0].id, size: { span: 4 } });
  } else {
    out.push({ id: map.id, size: { span: 12 } });
  }
  packRun(after, out);
}

/** The most-used widgets first, sized so every row fills the dashboard
 *  exactly. The leading KPI strip stays on top - it's a summary, not
 *  something to rank - and widgets with equal use keep their current order.
 *  Full-width lists sit on their own rows; the tiles between them are
 *  grouped into rows of two or three, and a map anchors a two-row block. */
export function recommendedLayout(items: LayoutItem[], usage: Record<string, number>): RecommendedLayout {
  const [head, ...rest] = items;
  const pinned = head && !(head.id in usage) ? [head] : [];
  const ranked = (pinned.length ? rest : items)
    .map((it, i) => ({ it, i, n: usage[it.id] ?? 0 }))
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .map((x) => x.it);

  const out: { id: string; size: LayoutSize }[] = pinned.map((it) => ({ id: it.id, size: { span: 12 } }));
  let run: LayoutItem[] = [];
  for (const it of ranked) {
    if (isFull(it)) {
      packRun(run, out);
      run = [];
      out.push({ id: it.id, size: { span: 12 } });
    } else {
      run.push(it);
    }
  }
  packRun(run, out);

  return { order: out.map((x) => x.id), sizes: Object.fromEntries(out.map((x) => [x.id, x.size])) };
}
