"use client";

import { useEffect } from "react";
import { X, ChevronRight, Mail, Phone, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConversationLauncher } from "@/components/dashboard/conversation-launcher";
import { OPS_CONTRACTS, OPS_CONTRACT_DETAILS, type OpsContract } from "@/lib/operations-data";
import { CUSTOMER_DETAILS } from "@/lib/dashboard-data";
import { useDetailDrawers, drawerLayer } from "@/components/dashboard/detail-drawers";
import ContextSummary from "@/components/dashboard/context-summary";

/** "Baltic Wind NL" -> "baltic-wind-nl", the CUSTOMER_DETAILS key. */
function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function parseValue(v: string): number {
  const n = parseFloat(v.replace(/[^0-9.]/g, ""));
  return /k\b/i.test(v) ? n / 1000 : n;
}
function fmtValue(m: number): string {
  return m >= 1 ? `€${m.toFixed(1)}m` : `€${Math.round(m * 1000)}k`;
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">{children}</div>;
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base text-gray-900 mb-4">{children}</h3>;
}

function StatusBadge({ status }: { status: string }) {
  const critical = status === "critical" || status === "Critical";
  const atRisk = status === "at-risk" || status === "At risk";
  const cls = critical ? "bg-status-critical-deep text-white font-bold" : atRisk ? "border border-gray-400 text-gray-700" : "border border-gray-200 text-gray-500";
  const label = critical ? "Critical" : atRisk ? "At risk" : status === "In service" ? "In service" : "On track";
  return <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${cls}`}>{label}</span>;
}

function HealthBar({ pct }: { pct: number }) {
  const low = pct < 40;
  return (
    <span className="flex items-center gap-2 w-24 shrink-0">
      <span className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <span className={`block h-full rounded-full ${low ? "bg-status-critical" : "bg-chart-line"}`} style={{ width: `${pct}%` }} />
      </span>
      <span className={`text-xs shrink-0 ${low ? "text-gray-900" : "text-gray-500"}`}>{pct}%</span>
    </span>
  );
}

/** A drill row that hands off to another drawer. */
function DrillRow({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="flex items-center gap-3 py-2.5 border-b border-gray-200 last:border-0 cursor-pointer group"
    >
      {children}
      <ChevronRight size={14} strokeWidth={1.5} className="text-gray-500 group-hover:text-gray-600 transition-colors shrink-0" />
    </div>
  );
}

/** Everything a customer's contracts cover, rolled up - read by the drawer,
 *  by its body, and by the facts beside the full page. */
export function customerRollup(customer: string | null) {
  const contracts: OpsContract[] = customer ? OPS_CONTRACTS.filter((c) => c.customer === customer) : [];
  if (!customer || contracts.length === 0) return null;

  const assets = contracts.flatMap((c) =>
    (OPS_CONTRACT_DETAILS[c.id]?.assets ?? []).map((a) => ({ ...a, contractId: c.id, contractName: c.name }))
  );
  const value = contracts.reduce((s, c) => s + parseValue(c.value), 0);
  const alerts = contracts.reduce((s, c) => s + c.alerts.length, 0);
  const avgHealth = assets.length ? Math.round(assets.reduce((s, a) => s + a.health, 0) / assets.length) : 0;
  const worst = contracts.some((c) => c.status === "critical") ? "critical" : "at-risk";

  // Customer-side contacts live on each contract; dedupe across them.
  const contacts = Array.from(
    new Map(
      contracts.flatMap((c) => OPS_CONTRACT_DETAILS[c.id]?.contacts ?? []).map((p) => [p.email, p])
    ).values()
  );

  const detail = CUSTOMER_DETAILS[slug(customer)];
  const region = OPS_CONTRACT_DETAILS[contracts[0]?.id]?.related.region;
  const summary =
    detail?.contextSummary ??
    `${customer} holds ${contracts.length} active contract${contracts.length > 1 ? "s" : ""} worth ${fmtValue(value)}, covering ${assets.length} asset${assets.length > 1 ? "s" : ""} at an average health of ${avgHealth}%. ${alerts} alert${alerts > 1 ? "s are" : " is"} open across the estate.`;

  return {
    contracts,
    assets,
    value,
    alerts,
    avgHealth,
    worst,
    contacts,
    region,
    summary,
    subtitle: detail?.subtitle ?? `Customer estate${region ? ` · ${region}` : ""}`,
    facts: [
      { label: "Status", value: worst === "critical" ? "Critical" : "At risk" },
      { label: "Estate value", value: fmtValue(value) },
      { label: "Contracts", value: String(contracts.length) },
      { label: "Assets", value: String(assets.length) },
      { label: "Avg health", value: `${avgHealth}%` },
      { label: "Open alerts", value: String(alerts) },
    ],
  };
}

/** The customer's estate - the same content the drawer shows. */
export function CustomerBody({ customer, onAction }: { customer: string; onAction: (prompt: string) => void }) {
  const drawers = useDetailDrawers();
  const roll = customerRollup(customer);
  if (!roll) return null;
  const { assets, value, contracts, avgHealth, contacts, worst, summary } = roll;
  void onAction;

  return (
    <div className="flex flex-col gap-4">
      <ContextSummary summary={summary} critical={worst === "critical"} />

      {contacts.length > 0 && (
        <Card>
          <SectionTitle>Contacts</SectionTitle>
          <div className="flex flex-col gap-3">
            {contacts.map((p) => (
              <div key={p.email}>
                <p className="text-sm text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-500">{p.role}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Mail size={12} strokeWidth={1.5} className="text-gray-500" />
                    {p.email}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Phone size={12} strokeWidth={1.5} className="text-gray-500" />
                    {p.phone}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base text-gray-900">Contracts</h3>
          <span className="text-xs text-gray-500">{fmtValue(value)} total</span>
        </div>
        <div className="flex flex-col">
          {contracts.map((c) => (
            <DrillRow key={c.id} onClick={() => drawers?.openContract({ kind: "ops", id: c.id })}>
              <span className="flex-1 min-w-0">
                <span className="block text-sm text-gray-700 truncate group-hover:text-gray-900 transition-colors">{c.name}</span>
                <span className="block text-xs text-gray-500">
                  {c.value} · {c.owner} · {c.alerts.length} alert{c.alerts.length === 1 ? "" : "s"}
                </span>
              </span>
              <StatusBadge status={c.status} />
            </DrillRow>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base text-gray-900">Assets</h3>
          <span className="text-xs text-gray-500">{avgHealth}% avg health</span>
        </div>
        <div className="flex flex-col">
          {assets.map((a) => (
            <DrillRow key={a.code} onClick={() => drawers?.openAsset(a.code.toLowerCase())}>
              <span className="flex-1 min-w-0">
                <span className="block text-sm text-gray-700 truncate group-hover:text-gray-900 transition-colors">{a.code}</span>
                <span className="block text-xs text-gray-500 truncate">{a.type}</span>
              </span>
              <HealthBar pct={a.health} />
              <StatusBadge status={a.status} />
            </DrillRow>
          ))}
        </div>
      </Card>
    </div>
  );
}

interface Props {
  customer: string | null;
  onClose: () => void;
}

export default function CustomerDrawer({ customer, onClose }: Props) {
  // Contracts and assets open over this drawer.
  const drawers = useDetailDrawers();
  const contracts: OpsContract[] = customer ? OPS_CONTRACTS.filter((c) => c.customer === customer) : [];
  const open = !!customer && contracts.length > 0;
  const shell = drawerLayer(open);
  const launch = useConversationLauncher();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const roll = customerRollup(customer);

  const runAction = (prompt: string) => {
    onClose();
    launch({ context: customer ?? undefined, prompt, entity: customer ? { kind: "customer", name: customer } : undefined });
  };

  return (
    <>
      <div onClick={onClose} {...shell.backdrop} />
      <div {...shell.panel}>
        {open && customer && (
          <>
            {/* Header */}
            <div className="shrink-0 px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h2 className="text-2xl text-gray-900">{customer}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{roll?.subtitle ?? ""}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => drawers?.openPage({ kind: "customer", id: customer! })}
                    aria-label="Open as a page"
                    title="Open as a page"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <Maximize2 size={15} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-3 mt-4">
                {(roll?.facts ?? []).map((s) => (
                  <div key={s.label}>
                    <p className="text-[11px] text-gray-500 tracking-wider">{s.label}</p>
                    <p className="text-sm text-gray-800 mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-5 bg-white">
              <CustomerBody customer={customer} onAction={runAction} />
            </div>
            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => runAction(`Summarise the ${customer} estate`)}
                className="w-full rounded-full h-auto py-2.5 text-sm text-gray-700 cursor-pointer"
              >
                Ask HMAX
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
