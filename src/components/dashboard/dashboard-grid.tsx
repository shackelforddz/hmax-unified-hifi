"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddWidgetDialog, { WidgetPreview, dismissWidgetSuggestion, isWidgetSuggestionDismissed, suggestedWidgetFor } from "./add-widget-dialog";
import { libraryWidget } from "./widget-library";
import CustomWidgetView from "./sales/custom-widget-view";
import { type CustomWidgetConfig } from "@/lib/custom-widget";
import { recommendedLayout, recordInteraction, usageFor, widgetName, type LayoutSize } from "@/lib/layout-usage";
import { useAppSelector } from "@/store/hooks";

/* A widget slot in the dashboard bento grid. Spans are out of 12 columns. */
export interface GridItem {
  id: string;
  span: number;
  /** Row span, for bento blocks that stand taller than their neighbours. */
  rows?: number;
  /** Stretch the widget to the row height (the existing `tile` behaviour). */
  tile?: boolean;
  node: ReactNode;
  /** Pinned in place - the "add a widget" tile always trails the list. */
  fixed?: boolean;
}

const KEY = (k: string) => `hmax:layout:${k}`;

/* Dashboards whose layout recommendation has been dismissed this session. */
const dismissedLayoutRecommendation = new Set<string>();

/** A layout: widget order, plus any sizes that differ from each widget's own. */
interface Layout {
  order: string[];
  sizes: Record<string, LayoutSize>;
}

const isIdList = (x: unknown): x is string[] => Array.isArray(x) && x.every((v) => typeof v === "string");

function readLayout(key: string): Layout | null {
  try {
    const raw = localStorage.getItem(KEY(key));
    const parsed = raw ? JSON.parse(raw) : null;
    // Older saves stored just the order.
    if (isIdList(parsed)) return { order: parsed, sizes: {} };
    if (parsed && isIdList(parsed.order)) return { order: parsed.order, sizes: parsed.sizes ?? {} };
    return null;
  } catch {
    return null;
  }
}

function writeLayout(key: string, layout: Layout | null) {
  try {
    if (layout) localStorage.setItem(KEY(key), JSON.stringify(layout));
    else localStorage.removeItem(KEY(key));
  } catch {
    /* private browsing / blocked storage - the layout just won't persist */
  }
}

/** Saved order, reconciled against the widgets that actually exist now:
 *  removed widgets drop out, newly added ones append. */
function reconcile(saved: string[] | null, items: GridItem[]): string[] {
  const ids = items.map((i) => i.id);
  if (!saved) return ids;
  const known = new Set(ids);
  const kept = saved.filter((id) => known.has(id));
  return [...kept, ...ids.filter((id) => !kept.includes(id))];
}

const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
const sameSizes = (a: Record<string, LayoutSize>, b: Record<string, LayoutSize>) =>
  JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());
const sameLayout = (a: Layout, b: Layout) => same(a.order, b.order) && sameSizes(a.sizes, b.sizes);

export default function DashboardGrid({
  storageKey,
  items,
}: {
  storageKey: string;
  items: GridItem[];
}) {
  // Widgets the user added here - from the library, or built to order.
  const [adding, setAdding] = useState(false);
  const closeAdding = () => setAdding(false);
  const [libraryIds, setLibraryIds] = useState<string[]>([]);
  const [customWidgets, setCustomWidgets] = useState<CustomWidgetConfig[]>([]);

  const allItems = useMemo(() => {
    const added: GridItem[] = [
      ...libraryIds.flatMap((id) => {
        const w = libraryWidget(id);
        return w ? [{ id: `lib-${id}`, span: w.span, tile: true, node: w.render() }] : [];
      }),
      ...customWidgets.map((w) => ({ id: w.id, span: 6, tile: true, node: <CustomWidgetView config={w} /> })),
    ];
    return [...items, ...added];
  }, [items, libraryIds, customWidgets]);

  const defaultOrder = useMemo(() => allItems.map((i) => i.id), [allItems]);
  /** The committed layout. */
  const [layout, setLayout] = useState<Layout>({ order: defaultOrder, sizes: {} });
  const order = layout.order;
  /** The in-progress layout while reorganizing; null when not editing. */
  const [draft, setDraft] = useState<Layout | null>(null);
  // The id lives in a ref as well as state: dragover/drop can fire in the
  // same tick as dragstart, before a state update has flushed.
  const dragRef = useRef<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const editing = draft !== null;

  // Recommended layout: usage is read on the client, and previewing swaps the
  // draft for the recommended order so it can be edited before saving.
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [previewing, setPreviewing] = useState(false);
  const [layoutDismissed, setLayoutDismissed] = useState(() => dismissedLayoutRecommendation.has(storageKey));
  const [widgetDismissed, setWidgetDismissed] = useState(false);
  // The suggestions panel starts collapsed - the bar names what's inside it.
  const [panelOpen, setPanelOpen] = useState(false);
  const role = useAppSelector((s) => s.auth.selectedRole);
  const activeLayout = draft ?? layout;
  const active = activeLayout.order;

  // Restore on mount, then keep in sync as widgets are added or removed.
  // This has to run in an effect rather than a lazy initialiser: localStorage
  // does not exist during SSR, and reading it on the first client render would
  // hydrate a different order than the server sent.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLayout((prev) => {
      const saved = readLayout(storageKey);
      const next = { order: reconcile(saved?.order ?? null, allItems), sizes: saved?.sizes ?? {} };
      return sameLayout(prev, next) ? prev : next;
    });
  }, [storageKey, allItems]);

  // Usage drives the layout suggestion, so the bar can name it before the user
  // opens anything. Client-only, for the same reason as the layout restore.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsage(usageFor(storageKey));
  }, [storageKey]);

  const byId = useMemo(() => new Map(allItems.map((i) => [i.id, i])), [allItems]);
  // Pinned widgets always trail, wherever they end up in the saved order.
  const ordered = useMemo(() => {
    const live = active.map((id) => byId.get(id)).filter((i): i is GridItem => !!i);
    return [...live.filter((i) => !i.fixed), ...live.filter((i) => i.fixed)];
  }, [active, byId]);

  const dirty = editing && !sameLayout(activeLayout, layout);
  const isDefault = same(active, defaultOrder) && Object.keys(activeLayout.sizes).length === 0;

  const drop = (targetId: string) => {
    const moving = dragRef.current;
    if (!moving || moving === targetId || !editing) return;
    const next = [...active];
    const from = next.indexOf(moving);
    const to = next.indexOf(targetId);
    if (from === -1 || to === -1) return;
    next.splice(from, 1);
    next.splice(to, 0, moving);
    setDraft({ ...activeLayout, order: next });
  };

  const end = () => {
    dragRef.current = null;
    setDragId(null);
    setOverId(null);
  };

  const startEditing = () => {
    setUsage(usageFor(storageKey));
    setDraft(layout);
    setPreviewing(false);
  };

  const recommended = useMemo(
    () =>
      recommendedLayout(
        order.map((id) => byId.get(id)).filter((i): i is GridItem => !!i && !i.fixed),
        usage
      ),
    [order, byId, usage]
  );
  // Named in the order the layout actually places them.
  const topUsed = recommended.order.filter((id) => usage[id]).slice(0, 3);

  /* ── What HMAX has to suggest for this dashboard ─────────────────
     Both suggestions live in the bar rather than behind it: a layout built
     from usage, and the one widget this role is missing. Each stays until it
     is applied or dismissed. */
  const layoutSuggestion =
    !layoutDismissed && Object.keys(usage).length > 0 && !sameLayout(recommended, layout);

  const widgetSuggestion = useMemo(() => {
    if (widgetDismissed || isWidgetSuggestionDismissed(role)) return null;
    const s = suggestedWidgetFor(role);
    if (!s || byId.has(s.widget.id) || byId.has(`lib-${s.widget.id}`)) return null;
    return s;
  }, [role, widgetDismissed, byId]);

  const suggestions = [layoutSuggestion, !!widgetSuggestion].filter(Boolean).length;
  const suggestionSummary = [
    layoutSuggestion && "Reorder around what you use most",
    widgetSuggestion && `Add ${widgetSuggestion.widget.title}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const dismissLayout = () => {
    dismissedLayoutRecommendation.add(storageKey);
    setLayoutDismissed(true);
  };
  const dismissWidget = () => {
    dismissWidgetSuggestion(role);
    setWidgetDismissed(true);
  };
  const previewRecommended = () => {
    setPanelOpen(false);
    setDraft(recommended);
    setPreviewing(true);
  };
  const addSuggested = (id: string) => {
    setLibraryIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
    setPanelOpen(false);
  };

  /** Reset a saved layout without having to enter edit mode first. */
  const resetSaved = () => {
    setLayout({ order: defaultOrder, sizes: {} });
    writeLayout(storageKey, null);
  };

  // How far the draft has moved from the committed layout, for the edit bar.
  const moved = editing ? activeLayout.order.filter((id, i) => layout.order[i] !== id).length : 0;

  const save = () => {
    if (draft) {
      setLayout(draft);
      const isDefaultDraft = same(draft.order, defaultOrder) && Object.keys(draft.sizes).length === 0;
      writeLayout(storageKey, isDefaultDraft ? null : draft);
    }
    setDraft(null);
    setPreviewing(false);
    end();
  };

  const cancel = () => {
    setDraft(null);
    setPreviewing(false);
    end();
  };

  return (
    <>
      {/* ── Customize bar ──────────────────────────────────────────
          Resting, it is one row: what HMAX suggests for this dashboard on the
          left, the two ways to change it on the right. Editing, the whole row
          turns dark so the mode is never in doubt. */}
      {editing ? (
        <div className="flex items-center gap-x-3 gap-y-2 flex-wrap bg-gray-900 rounded-full pl-4 pr-1.5 py-1.5 animate-message-in">
          <span className="flex items-center gap-2 text-xs font-bold text-white shrink-0">
            <span aria-hidden className={`size-1.5 rounded-full ${previewing ? "bg-[#3b82f6]" : "bg-white/60"}`} />
            {previewing ? "Previewing the recommended layout" : "Editing layout"}
          </span>
          <span className="text-xs text-white/50 min-w-0 truncate">
            Drag a widget by its handle to reorder{moved > 0 ? ` · ${moved} moved` : ""}
          </span>
          <div className="ml-auto flex items-center gap-1 shrink-0">
            {previewing ? (
              <button
                onClick={() => {
                  setDraft(layout);
                  setPreviewing(false);
                }}
                className="text-xs text-white/60 hover:text-white transition-colors cursor-pointer px-2"
              >
                Back to current layout
              </button>
            ) : (
              !isDefault && (
                <button
                  onClick={() => setDraft({ order: defaultOrder, sizes: {} })}
                  className="text-xs text-white/60 hover:text-white transition-colors cursor-pointer px-2"
                >
                  Reset layout
                </button>
              )
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={cancel}
              className="rounded-full text-white hover:bg-white/10 hover:text-white cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={save}
              disabled={!dirty}
              className="rounded-full bg-white text-gray-900 hover:bg-white/80 cursor-pointer"
            >
              Save changes
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          {suggestions > 0 ? (
            <button
              onClick={() => setPanelOpen((o) => !o)}
              aria-expanded={panelOpen}
              className="group flex-1 min-w-[280px] flex items-center gap-2.5 h-9 pl-3 pr-2.5 bg-white border border-gray-200 rounded-full hover:border-gray-400 transition-colors cursor-pointer text-left"
            >
              <span aria-hidden className="size-2 rounded-full bg-[#3b82f6] shrink-0" />
              <span className="text-xs font-bold text-gray-900 shrink-0">
                {suggestions === 1 ? "1 suggestion" : `${suggestions} suggestions`} from HMAX
              </span>
              <span className="text-xs text-gray-500 min-w-0 truncate">{suggestionSummary}</span>
              <ChevronDown
                size={14}
                strokeWidth={1.5}
                className={`ml-auto shrink-0 text-gray-400 transition-transform ${panelOpen ? "rotate-180" : ""}`}
              />
            </button>
          ) : (
            <span className="flex-1 min-w-[200px] flex items-center gap-2 h-9 pl-1 text-xs text-gray-400">
              {isDefault ? "Default layout" : "Your layout"} · {ordered.length} widgets
              {!isDefault && (
                <button onClick={resetSaved} className="text-gray-500 hover:text-gray-900 underline underline-offset-2 transition-colors cursor-pointer">
                  Reset
                </button>
              )}
            </span>
          )}
          <button
            onClick={() => setAdding(true)}
            className="h-9 px-3.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:border-gray-400 transition-colors cursor-pointer shrink-0"
          >
            Add widget
          </button>
          <button
            onClick={startEditing}
            className="h-9 px-3.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:border-gray-400 transition-colors cursor-pointer shrink-0"
          >
            Edit layout
          </button>
        </div>
      )}

      {/* The suggestions themselves - opened from the bar, side by side */}
      {!editing && panelOpen && suggestions > 0 && (
        <div className="grid gap-3 md:grid-cols-2 animate-message-in">
          {layoutSuggestion && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
              <span className="text-[11px] text-gray-400 tracking-wider">Recommended by HMAX</span>
              <p className="text-sm font-bold text-gray-900">A layout built around what you use most</p>
              <p className="text-xs text-gray-500 leading-4">
                Widgets are ordered by how much you&apos;ve used them over the last 30 days and resized so every row fills.{" "}
                {topUsed.map(widgetName).join(", ")} lead the dashboard.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {topUsed.map((id) => (
                  <span key={id} className="text-[11px] text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5">
                    {widgetName(id)} · {usage[id]} interactions
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2 mt-auto">
                <Button size="sm" onClick={previewRecommended} className="rounded-full cursor-pointer">
                  Preview layout
                </Button>
                <Button variant="ghost" size="sm" onClick={dismissLayout} className="rounded-full text-gray-500 cursor-pointer">
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {widgetSuggestion && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-2 gap-4">
              <WidgetPreview
                render={widgetSuggestion.widget.render}
                span={widgetSuggestion.widget.span}
                height={150}
                className="bg-gray-50"
              />
              <div className="flex flex-col gap-2 min-w-0">
                <span className="text-[11px] text-gray-400 tracking-wider">Recommended by HMAX</span>
                <p className="text-sm font-bold text-gray-900 leading-5">{widgetSuggestion.widget.title}</p>
                <p className="text-xs text-gray-500 leading-4">{widgetSuggestion.reason}</p>
                <div className="flex items-center gap-2 pt-1 mt-auto">
                  <Button size="sm" onClick={() => addSuggested(widgetSuggestion.widget.id)} className="rounded-full cursor-pointer">
                    Add to dashboard
                  </Button>
                  <Button variant="ghost" size="sm" onClick={dismissWidget} className="rounded-full text-gray-500 cursor-pointer">
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {adding && (
        <AddWidgetDialog
          onDashboard={libraryIds}
          onAddLibrary={(id) => {
            setLibraryIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
          }}
          onAddCustom={(config) => {
            setCustomWidgets((ws) => [...ws, config]);
            closeAdding();
          }}
          onClose={closeAdding}
        />
      )}

      <div className="grid grid-cols-12 gap-4 items-stretch [&>*]:min-w-0 [&>.tile>*:not([data-grid-ui])]:h-full">
        {ordered.map((item) => {
          const size = activeLayout.sizes[item.id];
          const span = size?.span ?? item.span;
          const rows = size ? size.rows : item.rows;
          const dragging = dragId === item.id;
          const isOver = overId === item.id && dragId !== null && dragId !== item.id;
          return (
            <div
              key={item.id}
              onDragOver={(e) => {
                if (!dragRef.current) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setOverId(item.id);
              }}
              onDragLeave={() => setOverId((o) => (o === item.id ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                drop(item.id);
                end();
              }}
              style={{
                gridColumn: `span ${span} / span ${span}`,
                ...(rows ? { gridRow: `span ${rows} / span ${rows}` } : {}),
              }}
              // Clicks inside a widget count towards the layout recommendation.
              onPointerDownCapture={() => !editing && recordInteraction(storageKey, item.id)}
              className={`relative transition-opacity ${item.tile ? "tile" : ""} ${dragging ? "opacity-40" : ""}`}
            >
              {/* In the preview, each widget shows how much it's used */}
              {editing && previewing && usage[item.id] ? (
                <span data-grid-ui className="absolute -top-2.5 left-7 z-30 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3b82f6] text-white whitespace-nowrap">
                  {usage[item.id]} interactions
                </span>
              ) : null}

              {/* While reorganizing, the widget reads as a movable block */}
              {editing && (
                <div data-grid-ui className="pointer-events-none absolute -inset-1 z-10 rounded-xl border border-dashed border-gray-300" />
              )}

              {/* Drop target outline - shows where the dragged widget will land */}
              {isOver && (
                <div data-grid-ui className="pointer-events-none absolute -inset-1 z-20 rounded-xl border-2 border-dashed border-gray-500" />
              )}

              {/* Drag handle - only while reorganizing, and the drag source
                  itself so clicks inside a widget are never intercepted. */}
              {editing && (
                <button
                  data-grid-ui
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    // Firefox needs data set for a drag to start at all.
                    e.dataTransfer.setData("text/plain", item.id);
                    // Ghost the whole widget rather than the little handle.
                    const widget = e.currentTarget.parentElement;
                    if (widget) e.dataTransfer.setDragImage(widget, 24, 24);
                    dragRef.current = item.id;
                    setDragId(item.id);
                  }}
                  onDragEnd={end}
                  aria-label={`Drag to reorder ${item.id}`}
                  title="Drag to reorder"
                  className="absolute -top-2 -left-2 z-30 w-7 h-7 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-500 transition-colors cursor-grab active:cursor-grabbing"
                >
                  <GripVertical size={14} strokeWidth={1.5} />
                </button>
              )}

              {item.node}
            </div>
          );
        })}
      </div>
    </>
  );
}
