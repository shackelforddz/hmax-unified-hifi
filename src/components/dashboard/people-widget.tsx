"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, MapPin, TriangleAlert } from "lucide-react";
import WidgetChat from "@/components/dashboard/widget-chat";
import ContractDrawer from "@/components/dashboard/operations/contract-drawer";
import OpportunityDrawer from "@/components/dashboard/sales/opportunity-drawer";
import { DELIVERY_TEAM, type Person } from "@/lib/people-data";
import { OPS_CONTRACTS, type OpsContract } from "@/lib/operations-data";
import { OPPORTUNITIES, leadDetail, type Opportunity } from "@/lib/sales-data";

/* ── Risk model ──────────────────────────────────────────────────── */
const HIGH_LOAD = 90; // near capacity
const OVER_ALLOCATED = 95; // over capacity

function contractsFor(person: Person): OpsContract[] {
  return person.contractIds
    .map((id) => OPS_CONTRACTS.find((c) => c.id === id))
    .filter((c): c is OpsContract => !!c);
}

function leadsFor(person: Person): Opportunity[] {
  return (person.leadIds ?? [])
    .map((id) => OPPORTUNITIES.find((o) => o.id === id))
    .filter((o): o is Opportunity => !!o);
}

// Most-severe reason first.
function riskReasons(person: Person, contracts: OpsContract[], leads: Opportunity[]): string[] {
  const reasons: string[] = [];
  if (person.allocation >= OVER_ALLOCATED) reasons.push("Over-allocated");
  else if (person.allocation >= HIGH_LOAD) reasons.push("High allocation");
  if (contracts.some((c) => c.status === "critical")) reasons.push("Critical contract");
  if (leads.some((l) => l.status === "stalled")) reasons.push("Stalled lead");
  return reasons;
}

function LeadBadge({ status }: { status: Opportunity["status"] }) {
  const cls =
    status === "stalled" ? "bg-black text-white"
    : status === "at-risk" ? "border border-gray-400 text-gray-700"
    : "border border-gray-300 text-gray-500";
  const label = status === "stalled" ? "Stalled" : status === "at-risk" ? "At risk" : "On track";
  return <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${cls}`}>{label}</span>;
}

function StatusBadge({ status }: { status: OpsContract["status"] }) {
  const cls = status === "critical" ? "bg-black text-white" : "border border-gray-400 text-gray-700";
  return <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${cls}`}>{status === "critical" ? "Critical" : "At risk"}</span>;
}

function RiskChip({ reason }: { reason: string }) {
  const cls = reason === "High allocation" ? "bg-gray-200 text-gray-700" : "bg-gray-900 text-white";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>
      <TriangleAlert size={10} strokeWidth={2} />
      {reason}
    </span>
  );
}

function PersonRow({
  person,
  defaultExpanded,
  onOpenContract,
  onOpenLead,
}: {
  person: Person;
  defaultExpanded: boolean;
  onOpenContract: (id: string) => void;
  onOpenLead: (opp: Opportunity) => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const contracts = contractsFor(person);
  const leads = leadsFor(person);
  const reasons = riskReasons(person, contracts, leads);

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <button onClick={() => setExpanded((e) => !e)} className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={person.avatar} alt={person.name} className="w-11 h-11 rounded-full object-cover bg-gray-200 grayscale shrink-0" />

          <div className="min-w-0 flex-1">
            <h4 className="text-base text-gray-900 leading-tight">{person.name}</h4>
            <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-0.5">
              <span>{person.role}</span>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-1"><MapPin size={12} strokeWidth={1.5} className="text-gray-400" />{person.location}</span>
            </p>
          </div>

          {/* Alerts sit where the allocation bar and counts used to */}
          <div className="flex items-center justify-end gap-1.5 flex-wrap shrink-0">
            {reasons.map((r) => (
              <RiskChip key={r} reason={r} />
            ))}
          </div>

          {expanded ? <ChevronUp size={16} strokeWidth={1.5} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} strokeWidth={1.5} className="text-gray-400 shrink-0" />}
        </div>
      </button>

      {expanded && (
        <>
          <hr className="border-gray-200" />
          <div className="px-5 py-3">
            {/* Competencies */}
            {person.competencies.length > 0 && (
              <>
                <p className="text-[11px] text-gray-400 tracking-wider mb-1.5">Competencies</p>
                <div className="flex flex-wrap gap-1.5 mb-3.5">
                  {person.competencies.map((c) => (
                    <span key={c} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              </>
            )}

            {/* Certifications - a delivery concern; sales roles carry none */}
            {person.certifications.length > 0 && (
              <>
                <p className="text-[11px] text-gray-400 tracking-wider mb-1.5">Certifications</p>
                <div className="flex flex-wrap gap-1.5 mb-3.5">
                  {person.certifications.map((cert) => {
                    const soon = cert.expires <= "2026-11"; // expiring within ~90 days
                    return (
                      <span
                        key={cert.name}
                        className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${soon ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-600"}`}
                      >
                        {cert.name}
                        <span className={soon ? "text-gray-300" : "text-gray-400"}>· exp {cert.expires}</span>
                      </span>
                    );
                  })}
                </div>
              </>
            )}

            {leads.length > 0 && (
              <>
                <p className="text-[11px] text-gray-400 tracking-wider mb-1">Assigned leads</p>
                {leads.map((l) => (
                  <div
                    key={l.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenLead(l)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenLead(l); } }}
                    className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0 cursor-pointer group"
                  >
                    <span className="text-sm text-gray-700 flex-1 min-w-0 truncate group-hover:text-gray-900 transition-colors underline underline-offset-2 decoration-gray-200 group-hover:decoration-gray-500">{l.title}</span>
                    <span className="text-xs text-gray-400 shrink-0 hidden sm:block">{l.account}</span>
                    <span className="text-xs text-gray-400 shrink-0 hidden sm:block">{l.value}</span>
                    <span className="text-xs text-gray-400 shrink-0 hidden sm:block">{l.stage}</span>
                    <LeadBadge status={l.status} />
                  </div>
                ))}
                <p className="text-[11px] text-gray-400 tracking-wider mb-1 mt-3.5">Assigned contracts</p>
              </>
            )}
            {leads.length === 0 && (
              <p className="text-[11px] text-gray-400 tracking-wider mb-1">Assigned contracts</p>
            )}
            {contracts.map((c) => (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpenContract(c.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenContract(c.id); } }}
                className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0 cursor-pointer group"
              >
                <span className="text-sm text-gray-700 flex-1 min-w-0 truncate group-hover:text-gray-900 transition-colors underline underline-offset-2 decoration-gray-200 group-hover:decoration-gray-500">{c.name}</span>
                <span className="text-xs text-gray-400 shrink-0 hidden sm:block">{c.customer}</span>
                <span className="text-xs text-gray-400 shrink-0 hidden sm:block">{c.value}</span>
                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

type Filter = "all" | "at-risk";

export default function PeopleWidget({ people = DELIVERY_TEAM, title = "People" }: { people?: Person[]; title?: string }) {
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [leadDrawer, setLeadDrawer] = useState<Opportunity | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [comp, setComp] = useState("all");
  const [cert, setCert] = useState("all");

  const isAtRisk = (p: Person) => riskReasons(p, contractsFor(p), leadsFor(p)).length > 0;
  const atRiskCount = people.filter(isAtRisk).length;
  const avgAllocation = Math.round(people.reduce((s, p) => s + p.allocation, 0) / people.length);

  // Filter options derived from the current team.
  const competencyOptions = Array.from(new Set(people.flatMap((p) => p.competencies))).sort();
  const certOptions = Array.from(new Set(people.flatMap((p) => p.certifications.map((c) => c.name)))).sort();

  const visible = people.filter(
    (p) =>
      (filter === "all" || isAtRisk(p)) &&
      (comp === "all" || p.competencies.includes(comp)) &&
      (cert === "all" || p.certifications.some((c) => c.name === cert))
  );
  // Surface at-risk people first, then by allocation (busiest first).
  const sorted = [...visible].sort((a, b) => {
    const ra = isAtRisk(a) ? 1 : 0;
    const rb = isAtRisk(b) ? 1 : 0;
    if (ra !== rb) return rb - ra;
    return b.allocation - a.allocation;
  });
  const firstAtRisk = sorted.find(isAtRisk)?.id;

  const FILTERS: { label: string; value: Filter; count: number }[] = [
    { label: "All", value: "all", count: people.length },
    { label: "At risk", value: "at-risk", count: atRiskCount },
  ];

  const selectCls =
    "text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-500 bg-white cursor-pointer outline-none hover:border-gray-300 max-w-[180px]";

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <ContractDrawer contractId={drawerId} onClose={() => setDrawerId(null)} />
      <OpportunityDrawer
        opp={leadDrawer}
        detail={leadDrawer ? leadDetail(leadDrawer) : null}
        onClose={() => setLeadDrawer(null)}
      />
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base text-gray-900">{title}</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              {people.length} on your team · {avgAllocation}% avg allocation
              {atRiskCount > 0 && <span> · {atRiskCount} at risk</span>}
            </p>
          </div>
          <WidgetChat title={title} />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-400">Priority</span>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-xs px-3 py-1 rounded-full transition-colors cursor-pointer ${
                filter === f.value ? "bg-black text-white" : "border border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {f.label} {f.count}
            </button>
          ))}

          <span className="text-gray-200 text-xs mx-1">|</span>

          {competencyOptions.length > 0 && (
            <>
              <span className="text-xs text-gray-400">Competency</span>
              <select value={comp} onChange={(e) => setComp(e.target.value)} className={selectCls}>
                <option value="all">All</option>
                {competencyOptions.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </>
          )}

          {certOptions.length > 0 && (
            <>
              <span className="text-xs text-gray-400">Certification</span>
              <select value={cert} onChange={(e) => setCert(e.target.value)} className={selectCls}>
                <option value="all">All</option>
                {certOptions.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </>
          )}

        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {sorted.length > 0 ? (
          sorted.map((p) => (
            <PersonRow key={p.id} person={p} defaultExpanded={p.id === firstAtRisk} onOpenContract={setDrawerId} onOpenLead={setLeadDrawer} />
          ))
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">No one on your team matches the selected filters.</p>
        )}
      </div>
    </div>
  );
}
