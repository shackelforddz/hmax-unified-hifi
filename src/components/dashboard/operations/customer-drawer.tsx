"use client";

import { useEffect } from "react";
import { X, ChevronRight, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConversationLauncher } from "@/components/dashboard/conversation-launcher";
import { OPS_CONTRACTS, OPS_CONTRACT_DETAILS, type OpsContract } from "@/lib/operations-data";
import { CUSTOMER_DETAILS } from "@/lib/dashboard-data";

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
  const cls = critical ? "bg-status-critical text-white font-bold" : atRisk ? "border border-gray-400 text-gray-700" : "border border-gray-200 text-gray-400";
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
      <span className={`text-xs shrink-0 ${low ? "text-gray-900" : "text-gray-400"}`}>{pct}%</span>
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
      <ChevronRight size={14} strokeWidth={1.5} className="text-gray-300 group-hover:text-gray-600 transition-colors shrink-0" />
    </div>
  );
}

interface Props {
  customer: string | null;
  onClose: () => void;
  /** Swap this drawer for the contract's own detail drawer. */
  onOpenContract: (contractId: string) => void;
  /** Swap this drawer for the asset's own detail drawer. */
  onOpenAsset: (assetCode: string, contractId: string) => void;
}

export default function CustomerDrawer({ customer, onClose, onOpenContract, onOpenAsset }: Props) {
  const contracts: OpsContract[] = customer ? OPS_CONTRACTS.filter((c) => c.customer === customer) : [];
  const open = !!customer && contracts.length > 0;
  const launch = useConversationLauncher();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Everything the customer's contracts cover, rolled up.
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

  const detail = customer ? CUSTOMER_DETAILS[slug(customer)] : undefined;
  const region = customer ? OPS_CONTRACT_DETAILS[contracts[0]?.id]?.related.region : undefined;
  const summary =
    detail?.contextSummary ??
    `${customer} holds ${contracts.length} active contract${contracts.length > 1 ? "s" : ""} worth ${fmtValue(value)}, covering ${assets.length} asset${assets.length > 1 ? "s" : ""} at an average health of ${avgHealth}%. ${alerts} alert${alerts > 1 ? "s are" : " is"} open across the estate.`;

  const runAction = (prompt: string) => {
    onClose();
    launch({ context: customer ?? undefined, prompt, entity: customer ? { kind: "customer", name: customer } : undefined });
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-[520px] max-w-[92vw] bg-white flex flex-col transition-[translate,box-shadow] duration-500 ease-in-out ${
          open ? "translate-x-0 shadow-2xl" : "translate-x-full shadow-none"
        }`}
      >
        {open && customer && (
          <>
            {/* Header */}
            <div className="shrink-0 px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h2 className="text-2xl text-gray-900">{customer}</h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {detail?.subtitle ?? `Customer estate${region ? ` · ${region}` : ""}`}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-3 mt-4">
                {[
                  { label: "Status", value: worst === "critical" ? "Critical" : "At risk" },
                  { label: "Estate value", value: fmtValue(value) },
                  { label: "Contracts", value: String(contracts.length) },
                  { label: "Assets", value: String(assets.length) },
                  { label: "Avg health", value: `${avgHealth}%` },
                  { label: "Open alerts", value: String(alerts) },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-[11px] text-gray-400 tracking-wider">{s.label}</p>
                    <p className="text-sm text-gray-800 mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-5 bg-white flex flex-col gap-4">
              <Card>
                <SectionTitle>Summary</SectionTitle>
                <p className="text-sm text-gray-500 leading-relaxed">{summary}</p>
              </Card>

              {contacts.length > 0 && (
                <Card>
                  <SectionTitle>Contacts</SectionTitle>
                  <div className="flex flex-col gap-3">
                    {contacts.map((p) => (
                      <div key={p.email}>
                        <p className="text-sm text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.role}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Mail size={12} strokeWidth={1.5} className="text-gray-400" />
                            {p.email}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Phone size={12} strokeWidth={1.5} className="text-gray-400" />
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
                  <span className="text-xs text-gray-400">{fmtValue(value)} total</span>
                </div>
                <div className="flex flex-col">
                  {contracts.map((c) => (
                    <DrillRow key={c.id} onClick={() => onOpenContract(c.id)}>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-gray-700 truncate group-hover:text-gray-900 transition-colors">{c.name}</span>
                        <span className="block text-xs text-gray-400">
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
                  <span className="text-xs text-gray-400">{avgHealth}% avg health</span>
                </div>
                <div className="flex flex-col">
                  {assets.map((a) => (
                    <DrillRow key={a.code} onClick={() => onOpenAsset(a.code, a.contractId)}>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-gray-700 truncate group-hover:text-gray-900 transition-colors">{a.code}</span>
                        <span className="block text-xs text-gray-400 truncate">{a.type}</span>
                      </span>
                      <HealthBar pct={a.health} />
                      <StatusBadge status={a.status} />
                    </DrillRow>
                  ))}
                </div>
              </Card>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => runAction(`Summarise the ${customer} estate`)}
                className="w-full rounded-full h-auto py-2.5 text-sm text-gray-700 cursor-pointer"
              >
                Create A Conversation
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
