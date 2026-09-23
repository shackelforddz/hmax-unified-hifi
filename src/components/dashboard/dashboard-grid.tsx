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
import { RecommendationActions, RecommendationCard, RecommendationHead, RecommendationTag } from "./recommendation-card";
import { DUR, EASE, Flip, STAGGER, dur, gsap, useGSAP } from "@/lib/motion";

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

/* How wide a widget sits, and what it widens to as the sheet narrows: a
   third becomes a half, a half becomes the whole row. Container queries, not
   media queries - the sheet's width depends on the conversation log beside
   it, so the window is the wrong thing to measure. */
const SPAN_CLS: Record<number, string> = {
  4: "col-span-4 @max-[880px]:col-span-6 @max-[660px]:col-span-12",
  6: "col-span-6 @max-[660px]:col-span-12",
  8: "col-span-8 @max-[880px]:col-span-12",
  12: "col-span-12",
};

/** A two-row block is only a block while it is still wider than its neighbours. */
const ROW_CLS = "row-span-2 @max-[880px]:row-span-1";

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

  /* ── Animating the reorder ──────────────────────────────────────
     A CSS-grid slot change has no property to transition, so the grid used to
     jump: a widget dropped in a new place simply appeared there, and previewing
     the recommended layout - the one moment the feature is meant to explain
     itself - was a hard cut. Flip closes that gap. It records where every
     widget is, lets React re-order the DOM, then animates each one from where
     it was to where it now sits.

     The recording is taken in a layout effect rather than in each handler that
     changes the order: at that point React has already placed the widgets in
     their new slots but nothing has painted, so the snapshot from the previous
     commit is exactly the "from" state, and every route into a new layout -
     drag, preview, cancel, reset, adding a widget - is covered by construction
     rather than by remembering to call something. */
  const gridRef = useRef<HTMLDivElement>(null);
  const snapshot = useRef<Flip.FlipState | null>(null);
  // Restoring a saved layout on mount changes the order too. That one is not
  // the user moving anything, so it is not worth animating - widgets flying
  // into place on every page load would read as a glitch.
  const armed = useRef(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      armed.current = true;
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Changes when a widget lands somewhere new, changes size, or joins the grid.
  const layoutSignature = ordered
    .map((i) => {
      const size = activeLayout.sizes[i.id];
      return `${i.id}:${size?.span ?? i.span}:${size ? size.rows : i.rows}`;
    })
    .join("|");

  useGSAP(
    () => {
      const el = gridRef.current;
      if (!el) return;
      const previous = snapshot.current;
      // Taken before Flip offsets anything, so it holds the settled layout.
      snapshot.current = Flip.getState(el.children, { props: "opacity" });
      if (!previous || !armed.current) return;

      Flip.from(previous, {
        duration: dur(DUR.flip),
        ease: EASE.standard,
        // Widgets that moved further set off a touch later, so the grid
        // resolves as a wave rather than everything sliding in lockstep.
        stagger: dur(STAGGER.grid),
        props: "opacity",
        // A widget that was not in the previous layout has just been added.
        onEnter: (els) =>
          gsap.fromTo(
            els,
            { opacity: 0, scale: 0.96 },
            { opacity: 1, scale: 1, duration: dur(DUR.slow), ease: EASE.entrance }
          ),
      });
    },
    { dependencies: [layoutSignature] }
  );

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
                className={`ml-auto shrink-0 text-gray-500 transition-transform ${panelOpen ? "rotate-180" : ""}`}
              />
            </button>
          ) : (
            <span className="flex-1 min-w-[200px] flex items-center gap-2 h-9 pl-1 text-xs text-gray-500">
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
            Add to page
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
        <div className="flex flex-col md:flex-row items-stretch gap-4 animate-message-in">
          {layoutSuggestion && (
            <RecommendationCard>
              <RecommendationHead title="A layout built around what you use most">
                Widgets are ordered by how much you&apos;ve used them over the last 30 days and resized so every row
                fills. {topUsed.map(widgetName).join(", ")} lead the dashboard.
              </RecommendationHead>
              <div className="flex flex-wrap gap-2">
                {topUsed.map((id) => (
                  <RecommendationTag key={id}>
                    {widgetName(id)} • {usage[id]} interactions
                  </RecommendationTag>
                ))}
              </div>
              <RecommendationActions>
                <Button onClick={previewRecommended} className="rounded-full px-4 cursor-pointer">
                  Preview layout
                </Button>
                <Button variant="ghost" onClick={dismissLayout} className="rounded-full px-4 cursor-pointer">
                  Dismiss
                </Button>
              </RecommendationActions>
            </RecommendationCard>
          )}

          {widgetSuggestion && (
            <RecommendationCard>
              <div className="flex flex-1 items-start gap-4">
                <div className="flex-1 min-w-0">
                  <RecommendationHead title={widgetSuggestion.widget.title}>{widgetSuggestion.reason}</RecommendationHead>
                </div>
                {/* What the widget looks like, rendered small */}
                <div className="hidden sm:block w-[200px] shrink-0 rounded-md p-2 bg-white">
                  <WidgetPreview render={widgetSuggestion.widget.render} bare />
                </div>
              </div>
              <RecommendationActions>
                <Button onClick={() => addSuggested(widgetSuggestion.widget.id)} className="rounded-full px-4 cursor-pointer">
                  Add to dashboard
                </Button>
                <Button variant="ghost" onClick={dismissWidget} className="rounded-full px-4 cursor-pointer">
                  Dismiss
                </Button>
              </RecommendationActions>
            </RecommendationCard>
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

      <div ref={gridRef} className="@container grid grid-cols-12 gap-4 items-stretch [&>*]:min-w-0 [&>.tile>*:not([data-grid-ui])]:h-full">
        {ordered.map((item) => {
          const size = activeLayout.sizes[item.id];
          const span = size?.span ?? item.span;
          const rows = size ? size.rows : item.rows;
          const dragging = dragId === item.id;
          const isOver = overId === item.id && dragId !== null && dragId !== item.id;
          return (
            <div
              key={item.id}
              // What Flip matches a widget by across a reorder.
              data-flip-id={item.id}
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
              style={SPAN_CLS[span] ? undefined : { gridColumn: `span ${span} / span ${span}` }}
              // Clicks inside a widget count towards the layout recommendation.
              onPointerDownCapture={() => !editing && recordInteraction(storageKey, item.id)}
              className={`relative transition-opacity ${SPAN_CLS[span] ?? ""} ${
                rows ? ROW_CLS : ""
              } ${item.tile ? "tile" : ""} ${dragging ? "opacity-40" : ""}`}
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
