import type { PartStatus, MaintStatus, InvoiceStatus } from "@/lib/operations-data";
import { AssetLink } from "@/components/dashboard/detail-drawers";

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">{children}</div>;
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base text-gray-900 mb-4">{children}</h3>;
}

const LEVEL_CLS: Record<string, string> = { Critical: "bg-gray-900 text-white", High: "bg-gray-700 text-white", Medium: "bg-gray-200 text-gray-700" };

export interface ContractSectionsData {
  assets: { code: string; type: string; status: string }[];
  parts: { label: string; qty: number; status: PartStatus }[];
  maintenance: { task: string; due: string; interval: string; status: MaintStatus }[];
  fieldService: { visit: string; engineer: string; date: string; status: string }[];
  /** Supplier / warehouse / site hand-offs, when the contract tracks them. */
  readiness?: { supplier: string[]; warehouse: string[]; site: string[] };
  finance: { revenue: string; netMargin: string; asSoldMargin: string; invoiced: string; outstanding: string };
  invoices: { code: string; milestone: string; amount: string; status: InvoiceStatus; due: string }[];
  payments: { date: string; event: string; amount: string }[];
  contacts: { name: string; role: string; email: string; phone: string }[];
  risks: { title: string; detail: string; level: "Critical" | "High" | "Medium" }[];
  team: { role: string; name: string }[];
}

/* The operational + financial detail shared by every contract drawer. */
export default function ContractSections({ d }: { d: ContractSectionsData }) {
  return (
    <>
      {/* Assets covered */}
      <Card>
        <SectionTitle>Assets</SectionTitle>
        <div className="flex flex-col">
          {d.assets.map((a) => {
            const cls = a.status === "Critical" ? "bg-gray-900 text-white" : a.status === "At risk" ? "bg-gray-200 text-gray-700" : "border border-gray-300 text-gray-500";
            return (
              <div key={a.code} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                <AssetLink asset={a.code} className="text-sm text-gray-500 w-20 shrink-0" />
                <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">{a.type}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${cls}`}>{a.status}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Readiness - the three hand-offs, in the order work moves through them */}
      {d.readiness && (
        <Card>
          <SectionTitle>Readiness</SectionTitle>
          <div className="flex flex-col">
            {[
              { label: "Supplier", items: d.readiness.supplier },
              { label: "Warehouse", items: d.readiness.warehouse },
              { label: "Site", items: d.readiness.site },
            ].map((row) => (
              <div key={row.label} className="flex items-start gap-4 py-2.5 border-b border-gray-100 last:border-0">
                <span className="text-sm font-bold text-gray-900 w-24 shrink-0">{row.label}</span>
                <span className="text-sm text-gray-500 flex-1 min-w-0">{row.items.join(" / ")}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Parts & materials */}
      <Card>
        <SectionTitle>Parts &amp; materials</SectionTitle>
        <div className="flex flex-col">
          {d.parts.map((pt) => {
            const label = pt.status === "in-stock" ? "In stock" : pt.status === "ordered" ? "Ordered" : "Backordered";
            const cls = pt.status === "backordered" ? "bg-gray-900 text-white" : pt.status === "ordered" ? "bg-gray-200 text-gray-700" : "border border-gray-300 text-gray-500";
            return (
              <div key={pt.label} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">{pt.label}</span>
                <span className="text-xs text-gray-400 shrink-0">×{pt.qty}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${cls}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Maintenance schedule */}
      <Card>
        <SectionTitle>Maintenance schedule</SectionTitle>
        <div className="flex flex-col">
          {d.maintenance.map((m) => {
            const cls = m.status === "Overdue" ? "bg-gray-900 text-white" : m.status === "Complete" ? "border border-gray-300 text-gray-500" : "bg-gray-200 text-gray-700";
            return (
              <div key={m.task} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{m.task}</p>
                  <p className="text-xs text-gray-400">{m.interval} · due {m.due}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${cls}`}>{m.status}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Field service */}
      <Card>
        <SectionTitle>Field service</SectionTitle>
        <div className="flex flex-col">
          {d.fieldService.map((f) => {
            const blocked = /blocked/i.test(f.status);
            return (
              <div key={f.visit} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{f.visit}</p>
                  <p className="text-xs text-gray-400">{f.engineer} · {f.date}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${blocked ? "bg-status-critical text-white font-bold" : "border border-gray-300 text-gray-500"}`}>{f.status}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Revenue & margin */}
      <Card>
        <SectionTitle>Revenue &amp; margin</SectionTitle>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {[
            { label: "Revenue", value: d.finance.revenue },
            { label: "Net margin", value: d.finance.netMargin },
            { label: "As-sold margin", value: d.finance.asSoldMargin },
            { label: "Invoiced", value: d.finance.invoiced },
            { label: "Outstanding", value: d.finance.outstanding },
          ].map((r) => (
            <div key={r.label}>
              <p className="text-[11px] text-gray-400 tracking-wider">{r.label}</p>
              <p className="text-sm text-gray-800 mt-0.5">{r.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Invoicing */}
      <Card>
        <SectionTitle>Invoicing</SectionTitle>
        <div className="flex flex-col">
          {d.invoices.map((inv) => {
            const cls = inv.status === "Overdue" ? "bg-gray-900 text-white" : inv.status === "Sent" ? "bg-gray-200 text-gray-700" : "border border-gray-300 text-gray-500";
            return (
              <div key={inv.code} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-500 w-24 shrink-0">{inv.code}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{inv.milestone}</p>
                  <p className="text-xs text-gray-400">due {inv.due}</p>
                </div>
                <span className="text-sm text-gray-700 shrink-0">{inv.amount}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${cls}`}>{inv.status}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Payment events */}
      <Card>
        <SectionTitle>Payment events</SectionTitle>
        <div className="flex flex-col">
          {d.payments.map((pay, i) => (
            <div key={i} className="flex gap-3 pb-4 last:pb-0">
              <div className="flex flex-col items-center shrink-0 pt-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                {i < d.payments.length - 1 && <span className="w-px flex-1 bg-gray-200 mt-1" />}
              </div>
              <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 leading-snug">{pay.event}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{pay.date}</p>
                </div>
                <span className={`text-sm shrink-0 ${pay.amount.startsWith("+") ? "text-gray-700" : "text-gray-500"}`}>{pay.amount}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Open risks */}
      <Card>
        <SectionTitle>Open risks</SectionTitle>
        <div className="flex flex-col gap-4">
          {d.risks.map((r, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 mb-1">{r.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{r.detail}</p>
              </div>
              <span className={`text-[11px] px-3 py-0.5 rounded-full whitespace-nowrap ${LEVEL_CLS[r.level]}`}>{r.level}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Delivery team */}
      <Card>
        <SectionTitle>Delivery team</SectionTitle>
        <div className="flex flex-col gap-2">
          {d.team.map((t) => (
            <div key={t.role} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
                {t.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="text-sm text-gray-800">{t.name}</p>
                <p className="text-xs text-gray-400">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Customer contacts */}
      <Card>
        <SectionTitle>Customer contacts</SectionTitle>
        <div className="flex flex-col gap-3">
          {d.contacts.map((ct) => (
            <div key={ct.email} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
                {ct.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-800">{ct.name}</p>
                <p className="text-xs text-gray-400">{ct.role}</p>
                <p className="text-xs text-gray-500 mt-0.5">{ct.email} · {ct.phone}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
