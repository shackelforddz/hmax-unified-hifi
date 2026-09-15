"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Eye, MessageCircle, EllipsisVertical, EyeOff, Trash2 } from "lucide-react";
import WidgetChat from "./widget-chat";
import { Button } from "@/components/ui/button";
import { useConversationLauncher } from "./conversation-launcher";
import {
  URGENCY,
  categoriesOf,
  customersOf,
  groupByUrgency,
  typesOf,
  type AlertItem,
  type AlertUrgency,
} from "@/lib/alerts";

const ALL = "__all__";

/* ── Badges ──────────────────────────────────────────────────────── */
function CustomerBadge({ children }: { children: ReactNode }) {
  return (
    <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full border border-transparent whitespace-nowrap">
      {children}
    </span>
  );
}

function TypeBadge({ children }: { children: ReactNode }) {
  return (
    <span className="bg-background text-foreground text-xs px-2 py-0.5 rounded-full border border-border whitespace-nowrap">
      {children}
    </span>
  );
}

/* ── Row menu - ignore / delete ──────────────────────────────────── */
function AlertMenu({ onIgnore, onDelete }: { onIgnore: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer text-left";

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((o) => !o)}
        aria-label="More actions"
        aria-expanded={open}
        className="rounded-full cursor-pointer"
      >
        <EllipsisVertical size={16} strokeWidth={1.5} />
      </Button>

      {open && (
        <div className="absolute right-0 top-9 z-30 w-40 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden py-1">
          <button
            onClick={() => {
              setOpen(false);
              onIgnore();
            }}
            className={item}
          >
            <EyeOff size={14} strokeWidth={1.5} className="text-gray-400" />
            Ignore alert
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className={`${item} text-red-600`}
          >
            <Trash2 size={14} strokeWidth={1.5} className="text-red-400" />
            Delete alert
          </button>
        </div>
      )}
    </div>
  );
}

/* ── A single alert ──────────────────────────────────────────────── */
function AlertCard({
  alert,
  onOpenDetail,
  onDismiss,
  extraActions,
}: {
  alert: AlertItem;
  onOpenDetail: (alert: AlertItem) => void;
  onDismiss: (id: string, how: "ignored" | "deleted") => void;
  extraActions?: (alert: AlertItem) => ReactNode;
}) {
  const launch = useConversationLauncher();

  return (
    <div className="border border-gray-200 rounded-lg p-6 flex gap-6 items-center">
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex gap-2 items-start flex-wrap">
          <CustomerBadge>{alert.customer}</CustomerBadge>
          <TypeBadge>{alert.type}</TypeBadge>
        </div>

        <div className="min-w-0">
          <p className="text-sm text-gray-900 leading-5">{alert.title}</p>
          <p className="text-xs text-gray-500 leading-4">{alert.detail}</p>
        </div>

        {alert.meta.length > 0 && (
          <div className="flex gap-4 flex-wrap text-xs text-gray-500 leading-4">
            {alert.meta.map((m) => (
              <span key={`${m.label ?? ""}${m.value}`} className="whitespace-nowrap">
                {m.label ? `${m.label}: ` : ""}
                {m.value}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 items-center shrink-0">
        {extraActions?.(alert)}

        {/* See details - same interaction the old "See Details" button had */}
        <Button
          variant="secondary"
          size="icon"
          onClick={() => onOpenDetail(alert)}
          aria-label={`See details for ${alert.title}`}
          className="rounded-full cursor-pointer"
        >
          <Eye size={16} strokeWidth={1.5} />
        </Button>

        {/* Primary CTA - opens the conversation with the alert's playbook */}
        <Button
          size="icon"
          onClick={() =>
            launch({
              context: alert.customer,
              prompt: alert.action,
              entity: alert.entity,
              playbook: alert.playbook,
            })
          }
          aria-label={alert.action}
          title={alert.action}
          className="rounded-full cursor-pointer"
        >
          <MessageCircle size={16} strokeWidth={1.5} />
        </Button>

        <AlertMenu
          onIgnore={() => onDismiss(alert.id, "ignored")}
          onDelete={() => onDismiss(alert.id, "deleted")}
        />
      </div>
    </div>
  );
}

/* ── Urgency accordion ───────────────────────────────────────────── */
function UrgencyBand({
  urgency,
  count,
  open,
  onToggle,
}: {
  urgency: AlertUrgency;
  count: number;
  open: boolean;
  onToggle: () => void;
}) {
  const { label, dot, band } = URGENCY[urgency];
  return (
    <button
      onClick={onToggle}
      aria-expanded={open}
      className={`w-full flex items-center px-4 py-2 rounded-md cursor-pointer ${band}`}
    >
      <div className="flex-1 min-w-0 flex gap-2 items-center">
        <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: dot }} />
        <span className="text-sm text-gray-900 leading-5 whitespace-nowrap">{label}</span>
        <span className="text-xs text-gray-500 leading-4 whitespace-nowrap">{count}</span>
      </div>
      <ChevronDown
        size={16}
        strokeWidth={1.5}
        className={`text-gray-500 shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
      />
    </button>
  );
}

/* ── Filter tabs ─────────────────────────────────────────────────── */
function TabGroup({
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
    `h-full flex gap-1.5 items-center justify-center px-2 py-1 rounded-full text-sm whitespace-nowrap transition-colors cursor-pointer ${
      active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
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
function Select({
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
        className="appearance-none w-full h-8 pl-2.5 pr-8 py-1 text-sm text-gray-500 bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-400 cursor-pointer truncate"
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

/* ── Widget ──────────────────────────────────────────────────────── */
interface AlertsWidgetProps {
  title: string;
  alerts: AlertItem[];
  /** Type tabs, in order. Defaults to the types present in `alerts`. */
  typeOptions?: string[];
  /** The eye icon hands the alert back so the caller can open its drawer. */
  onOpenDetail: (alert: AlertItem) => void;
  /** Drawer(s) the caller renders inside the card. */
  children?: ReactNode;
  /** Rendered between the filters and the first urgency band. */
  banner?: ReactNode;
  /** Rendered below the last urgency group. */
  footer?: ReactNode;
  /** Extra icon buttons rendered before the eye on a card (e.g. "add"). */
  extraActions?: (alert: AlertItem) => ReactNode;
  /** Notified when a card is ignored or deleted, so the caller can drop it
   *  from its own source list as well as from this widget. */
  onDismiss?: (alert: AlertItem, how: "ignored" | "deleted") => void;
  emptyLabel?: string;
}

export default function AlertsWidget({
  title,
  alerts,
  typeOptions,
  onOpenDetail,
  children,
  banner,
  footer,
  extraActions,
  onDismiss,
  emptyLabel = "No alerts match the selected filters.",
}: AlertsWidgetProps) {
  const [type, setType] = useState<string>("all");
  const [customer, setCustomer] = useState<string>(ALL);
  const [category, setCategory] = useState<string>("all");
  const [collapsed, setCollapsed] = useState<AlertUrgency[]>([]);
  // Ignored and deleted are tracked apart so a real backend can treat them
  // differently later; both drop the card from the list today.
  const [dismissed, setDismissed] = useState<Record<string, "ignored" | "deleted">>({});

  const live = useMemo(() => alerts.filter((a) => !dismissed[a.id]), [alerts, dismissed]);
  const types = useMemo(() => typeOptions ?? typesOf(live), [typeOptions, live]);
  const customers = useMemo(() => customersOf(alerts), [alerts]);
  const categories = useMemo(() => categoriesOf(alerts), [alerts]);

  const byCustomer = useMemo(() => live.filter((a) => customer === ALL || a.customer === customer), [live, customer]);
  const filtered = useMemo(
    () =>
      byCustomer.filter((a) => (type === "all" || a.type === type) && (category === "all" || a.category === category)),
    [byCustomer, type, category]
  );

  // Each tab row counts against the *other* active filters, so the number a
  // tab shows is exactly what clicking it gives you.
  const typeCount = (t: string) =>
    byCustomer.filter((a) => (category === "all" || a.category === category) && (t === "all" || a.type === t)).length;
  const categoryCount = (c: string) =>
    byCustomer.filter((a) => (type === "all" || a.type === type) && (c === "all" || a.category === c)).length;
  const groups = groupByUrgency(filtered);

  const toggle = (u: AlertUrgency) =>
    setCollapsed((c) => (c.includes(u) ? c.filter((x) => x !== u) : [...c, u]));

  return (
    <div className="bg-white border border-gray-200 rounded-[10px] p-6 flex flex-col gap-4">
      {children}

      {/* Header */}
      <div className="flex items-center w-full">
        <h3 className="flex-1 min-w-0 text-base text-gray-900 leading-6">{title}</h3>
        <WidgetChat title={title} />
      </div>

      {/* Filters - category tabs, stage tabs, then the customer select */}
      <div className="flex items-start justify-between gap-4 w-full">
        <div className="flex items-start gap-2 min-w-0 overflow-x-auto no-scrollbar">
          {categories.length > 0 && (
            <TabGroup
              value={category}
              onChange={setCategory}
              options={categories}
              countFor={categoryCount}
              label="Filter by category"
            />
          )}
          <TabGroup value={type} onChange={setType} options={types} countFor={typeCount} label="Filter by type" />
        </div>

        <Select value={customer} onChange={setCustomer} allLabel="All Customers" options={customers} label="Filter by customer" />
      </div>

      {banner}

      {/* Urgency groups */}
      {groups.length > 0 ? (
        groups.map(([urgency, list]) => {
          const open = !collapsed.includes(urgency);
          return (
            <div key={urgency} className="flex flex-col gap-4">
              <UrgencyBand
                urgency={urgency}
                count={list.length}
                open={open}
                onToggle={() => toggle(urgency)}
              />
              {open &&
                list.map((a) => (
                  <AlertCard
                    key={a.id}
                    alert={a}
                    onOpenDetail={onOpenDetail}
                    onDismiss={(id, how) => {
                      setDismissed((d) => ({ ...d, [id]: how }));
                      onDismiss?.(a, how);
                    }}
                    extraActions={extraActions}
                  />
                ))}
            </div>
          );
        })
      ) : (
        <p className="text-sm text-gray-400 text-center py-6">{emptyLabel}</p>
      )}

      {footer}
    </div>
  );
}
