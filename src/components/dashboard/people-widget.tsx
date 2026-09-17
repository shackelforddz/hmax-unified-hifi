"use client";

import { useState } from "react";
import { ChevronRight, MapPin } from "lucide-react";
import WidgetChat from "@/components/dashboard/widget-chat";
import { ALL, Select } from "@/components/dashboard/filter-controls";
import ContractDrawer from "@/components/dashboard/operations/contract-drawer";
import OpportunityDrawer from "@/components/dashboard/sales/opportunity-drawer";
import { DELIVERY_TEAM, type Person } from "@/lib/people-data";
import { OPS_CONTRACTS, type OpsContract } from "@/lib/operations-data";
import { OPPORTUNITIES, leadDetail, type Opportunity } from "@/lib/sales-data";

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


/* A contract or lead the person is on - its own tappable row so the list
   reads as distinct items rather than running text. */
function WorkRow({
  title,
  meta,
  onOpen,
}: {
  title: string;
  meta: string;
  onOpen: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-3 py-2.5 cursor-pointer group hover:border-gray-400 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 leading-snug line-clamp-2">{title}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{meta}</p>
      </div>
      <ChevronRight size={14} strokeWidth={1.5} className="text-gray-300 group-hover:text-gray-600 transition-colors shrink-0" />
    </div>
  );
}

function SectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs text-gray-500">{label}</p>
      <span className="text-xs text-gray-400">{count}</span>
    </div>
  );
}

function PersonCard({
  person,
  onOpenContract,
  onOpenLead,
}: {
  person: Person;
  onOpenContract: (id: string) => void;
  onOpenLead: (opp: Opportunity) => void;
}) {
  const contracts = contractsFor(person);
  const leads = leadsFor(person);
  const skills = [...person.competencies, ...person.certifications.map((c) => c.name)];

  return (
    <div className="border border-gray-200 rounded-2xl flex flex-col min-w-0 overflow-hidden">
      {/* Who */}
      <div className="flex items-start gap-3 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={person.avatar} alt={person.name} className="w-11 h-11 rounded-full object-cover bg-gray-200 shrink-0" />
        <div className="min-w-0 flex-1">
          <h4 className="text-base text-gray-900 leading-tight truncate">{person.name}</h4>
          <p className="text-sm text-gray-500 truncate mt-0.5">{person.role}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
            <MapPin size={12} strokeWidth={1.5} className="shrink-0" />
            <span className="truncate">{person.location}</span>
          </p>
        </div>
      </div>

      {/* The work they're on - the reason to look at this card */}
      <div className="border-y border-gray-200 p-4 flex flex-col gap-4 flex-1">
        <div>
          <SectionLabel label="Assigned contracts" count={contracts.length} />
          {contracts.length > 0 ? (
            <div className="flex flex-col gap-2">
              {contracts.map((c) => (
                <WorkRow
                  key={c.id}
                  title={c.name}
                  meta={`${c.customer} · ${c.value}`}
                  onOpen={() => onOpenContract(c.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No contracts assigned.</p>
          )}
        </div>

        {leads.length > 0 && (
          <div>
            <SectionLabel label="Assigned leads" count={leads.length} />
            <div className="flex flex-col gap-2">
              {leads.map((l) => (
                <WorkRow
                  key={l.id}
                  title={l.title}
                  meta={`${l.account} · ${l.value} · ${l.stage}`}
                  onOpen={() => onOpenLead(l)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Supporting detail - competencies and certifications as one list,
          kept quiet. Sales roles carry neither. */}
      {skills.length > 0 && (
        <div className="p-4">
          <p className="text-[11px] text-gray-400 tracking-wider mb-1.5">Competencies &amp; certifications</p>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {skills.map((name) => (
              <span key={name} className="shrink-0 whitespace-nowrap text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PeopleWidget({ people = DELIVERY_TEAM, title = "People" }: { people?: Person[]; title?: string }) {
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [leadDrawer, setLeadDrawer] = useState<Opportunity | null>(null);
  const [comp, setComp] = useState(ALL);
  const [cert, setCert] = useState(ALL);

  // Filter options derived from the current team.
  const competencyOptions = Array.from(new Set(people.flatMap((p) => p.competencies))).sort();
  const certOptions = Array.from(new Set(people.flatMap((p) => p.certifications.map((c) => c.name)))).sort();

  const visible = people.filter(
    (p) =>
      (comp === ALL || p.competencies.includes(comp)) &&
      (cert === ALL || p.certifications.some((c) => c.name === cert))
  );
  // Busiest first.
  const sorted = [...visible].sort((a, b) => b.allocation - a.allocation);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <ContractDrawer contractId={drawerId} onClose={() => setDrawerId(null)} />
      <OpportunityDrawer
        opp={leadDrawer}
        detail={leadDrawer ? leadDetail(leadDrawer) : null}
        onClose={() => setLeadDrawer(null)}
      />
      <div className="px-5 pt-5 pb-4 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base text-gray-900">{title}</h3>
          </div>
          <WidgetChat title={title} />
        </div>
        {/* Filters - competency and certification, when the team has any */}
        {(competencyOptions.length > 0 || certOptions.length > 0) && (
          <div className="flex items-start justify-end gap-2 w-full">
            {competencyOptions.length > 0 && (
              <Select
                value={comp}
                onChange={setComp}
                allLabel="All Competencies"
                options={competencyOptions}
                label="Filter by competency"
              />
            )}
            {certOptions.length > 0 && (
              <Select
                value={cert}
                onChange={setCert}
                allLabel="All Certifications"
                options={certOptions}
                label="Filter by certification"
              />
            )}
          </div>
        )}
      </div>

      {sorted.length > 0 ? (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {sorted.map((p) => (
            <PersonCard key={p.id} person={p} onOpenContract={setDrawerId} onOpenLead={setLeadDrawer} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center px-4 py-6">No one on your team matches the selected filters.</p>
      )}
    </div>
  );
}
