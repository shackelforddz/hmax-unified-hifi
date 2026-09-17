"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { GripVertical, RotateCcw, LayoutGrid, Check, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddWidgetDialog from "./add-widget-dialog";
import { libraryWidget } from "./widget-library";
import CustomWidgetView from "./sales/custom-widget-view";
import { type CustomWidgetConfig } from "@/lib/custom-widget";

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

/* Dashboards whose widget suggestion has been seen this session - once the
   "Add widget" dialog has been opened and closed, its badge stays gone even
   as the user switches roles and dashboards remount. */
const seenSuggestion = new Set<string>();

function readOrder(key: string): string[] | null {
  try {
    const raw = localStorage.getItem(KEY(key));
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.every((x) => typeof x === "string") ? parsed : null;
  } catch {
    return null;
  }
}

function writeOrder(key: string, order: string[] | null) {
  try {
    if (order) localStorage.setItem(KEY(key), JSON.stringify(order));
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

export default function DashboardGrid({
  storageKey,
  items,
}: {
  storageKey: string;
  items: GridItem[];
}) {
  // Widgets the user added here - from the library, or built to order.
  const [adding, setAdding] = useState(false);
  const [suggestionSeen, setSuggestionSeen] = useState(() => seenSuggestion.has(storageKey));
  const closeAdding = () => {
    setAdding(false);
    seenSuggestion.add(storageKey);
    setSuggestionSeen(true);
  };
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
  const [order, setOrder] = useState<string[]>(defaultOrder);
  /** The in-progress layout while reorganizing; null when not editing. */
  const [draft, setDraft] = useState<string[] | null>(null);
  // The id lives in a ref as well as state: dragover/drop can fire in the
  // same tick as dragstart, before a state update has flushed.
  const dragRef = useRef<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const editing = draft !== null;
  const active = draft ?? order;

  // Restore on mount, then keep in sync as widgets are added or removed.
  // This has to run in an effect rather than a lazy initialiser: localStorage
  // does not exist during SSR, and reading it on the first client render would
  // hydrate a different order than the server sent.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrder((prev) => {
      const next = reconcile(readOrder(storageKey), allItems);
      return same(prev, next) ? prev : next;
    });
  }, [storageKey, allItems]);

  const byId = useMemo(() => new Map(allItems.map((i) => [i.id, i])), [allItems]);
  // Pinned widgets always trail, wherever they end up in the saved order.
  const ordered = useMemo(() => {
    const live = active.map((id) => byId.get(id)).filter((i): i is GridItem => !!i);
    return [...live.filter((i) => !i.fixed), ...live.filter((i) => i.fixed)];
  }, [active, byId]);

  const dirty = editing && !same(active, order);
  const isDefault = same(active, defaultOrder);

  const drop = (targetId: string) => {
    const moving = dragRef.current;
    if (!moving || moving === targetId || !editing) return;
    const next = [...active];
    const from = next.indexOf(moving);
    const to = next.indexOf(targetId);
    if (from === -1 || to === -1) return;
    next.splice(from, 1);
    next.splice(to, 0, moving);
    setDraft(next);
  };

  const end = () => {
    dragRef.current = null;
    setDragId(null);
    setOverId(null);
  };

  const save = () => {
    if (draft) {
      setOrder(draft);
      writeOrder(storageKey, same(draft, defaultOrder) ? null : draft);
    }
    setDraft(null);
    end();
  };

  const cancel = () => {
    setDraft(null);
    end();
  };

  return (
    <>
      {/* Toolbar - reorganize on the left, add a widget on the right */}
      <div className="flex items-center gap-2 bg-secondary rounded-full px-2 py-2">
        {editing ? (
          <>
            <span className="text-xs text-gray-500 pl-1">Drag a widget by its handle to reorder, then save.</span>
            <div className="ml-auto flex items-center gap-2">
              {!isDefault && (
                <button
                  onClick={() => setDraft(defaultOrder)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors cursor-pointer mr-1"
                >
                  <RotateCcw size={12} strokeWidth={1.5} />
                  Reset layout
                </button>
              )}
              <Button variant="outline" size="sm" onClick={cancel} className="rounded-full cursor-pointer">
                <X size={13} strokeWidth={1.5} />
                Cancel
              </Button>
              <Button size="sm" onClick={save} disabled={!dirty} className="rounded-full cursor-pointer">
                <Check size={13} strokeWidth={1.5} />
                Save changes
              </Button>
            </div>
          </>
        ) : (
          <>
            <button onClick={() => setDraft(order)} className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:border-gray-400 transition-colors cursor-pointer shrink-0">
              <LayoutGrid size={13} strokeWidth={1.5} />
              Reorganize
            </button>
            <button
              onClick={() => setAdding(true)}
              aria-label={suggestionSeen ? "Add widget" : "Add widget - 1 suggestion"}
              className="ml-auto flex items-center gap-1.5 h-8 px-3 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:border-gray-400 transition-colors cursor-pointer shrink-0"
            >
              <Plus size={13} strokeWidth={1.5} />
              Add widget
              {!suggestionSeen && (
                <span className="min-w-4 h-4 px-1 rounded-full bg-status-critical text-white text-[10px] leading-4 text-center">1</span>
              )}
            </button>
          </>
        )}
      </div>

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
                gridColumn: `span ${item.span} / span ${item.span}`,
                ...(item.rows ? { gridRow: `span ${item.rows} / span ${item.rows}` } : {}),
              }}
              className={`relative transition-opacity ${item.tile ? "tile" : ""} ${dragging ? "opacity-40" : ""}`}
            >
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
