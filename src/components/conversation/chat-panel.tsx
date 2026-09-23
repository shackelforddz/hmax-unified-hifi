"use client";

import { useState, useRef } from "react";
import { Info, Check, AlertTriangle, ChevronLeft, ChevronRight, X, GripVertical, BarChart2, ClipboardCheck, CalendarClock, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FOLLOW_UP_LABEL, RECOMMENDATION_LABEL, type Suggestions } from "@/lib/knowledge-base";
import { type CustomWidgetConfig } from "@/lib/custom-widget";
import { type ContextEntity } from "@/components/dashboard/conversation-launcher";
import { ChartBody } from "@/components/dashboard/sales/custom-widget-view";
import { flowById, type GuidedFlow, type FlowField } from "@/lib/guided-flows";
import { type PlaybookPanel } from "@/lib/alert-playbooks";
import { DocContent, DocEditor, type ViewDoc } from "@/components/dashboard/sales/document-viewer";
import { ALL_PEOPLE } from "@/lib/people-data";
import { OPS_CONTRACT_DETAILS } from "@/lib/operations-data";

/* ── Typing indicator ────────────────────────────────────────────── */
function TypingBubble() {
  return (
    <div className="flex items-start gap-2.5 pr-8 mb-6 animate-message-in">
      <AiAvatar />
      <div className="bg-[#222222]/5 rounded-xl px-4 py-3.5 flex items-center gap-1.5">
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

/* ── Step tabs ───────────────────────────────────────────────────── */
const STEP_DEFS = [
  { num: 1, label: "Case" },
  { num: 2, label: "Scope" },
  { num: 3, label: "Staffing" },
  { num: 4, label: "Parts" },
  { num: 5, label: "Schedule" },
];

function StepTabs({ current, steps = STEP_DEFS }: { current: number; steps?: { num: number; label: string }[] }) {
  return (
    <div className="flex items-center justify-between gap-3 p-6 border-b border-[#e5e5e5]/20 overflow-x-auto no-scrollbar">
      {steps.map(({ num, label }) => {
        const active = num === current;
        const done = num < current;
        return (
          <div key={num} className="flex items-center gap-2 shrink-0">
            <div
              className={`size-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                active
                  ? "bg-[#222222] text-white"
                  : done
                    ? "bg-status-ok text-white"
                    : "border border-[#222222]/20 text-gray-500"
              }`}
            >
              {done ? <Check size={10} strokeWidth={2.5} /> : num}
            </div>
            <span className={`text-sm whitespace-nowrap transition-colors ${active ? "font-bold text-gray-950" : "text-gray-500"}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Info banner ─────────────────────────────────────────────────── */
function InfoBanner({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
      <Info size={15} className="text-gray-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm text-gray-700 font-medium leading-snug">{title}</p>
        <p className="text-sm text-gray-500 leading-snug">{sub}</p>
      </div>
    </div>
  );
}

/* ── Step 1: Case Details ────────────────────────────────────────── */
const CASE_TYPES = ["Corrective", "Preventive", "Mobilisation"];

/* The scope reads differently depending on why the crew is going out, so the
   case type writes the first draft of it. Changing the type rewrites the
   draft - it is a starting point, and the field stays editable. */
const SCOPE_BY_TYPE: Record<string, string> = {
  Corrective:
    "Investigate and resolve reported fault on HVDC Units S-12, S-14, and S-19 for Xcel Energy as outlined in OPP-441. Perform diagnostic testing, component replacement, and system re-commissioning.",
  Preventive:
    "Execute scheduled annual maintenance and inspection across HVDC Units S-12, S-14, and S-19 per Xcel Energy service agreement OPP-441.",
  Mobilisation:
    "Mobilise technical field crew, specialist equipment, and safety gear to Xcel Energy site for preliminary setup on HVDC Units S-12, S-14, and S-19 prior to main service window.",
};

function StepCase() {
  const [caseType, setCaseType] = useState("Corrective");
  const [scope, setScope] = useState(SCOPE_BY_TYPE.Corrective);
  const pickType = (t: string) => {
    setCaseType(t);
    setScope(SCOPE_BY_TYPE[t] ?? "");
  };
  const field = "w-full h-8 px-2.5 text-sm text-gray-950 border border-gray-200 rounded-full outline-none focus:border-gray-400 bg-white";
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-[28px] leading-[normal] text-gray-950">Case details</h3>
        <p className="text-sm text-gray-500 leading-[1.4]">
          Confirm or update the case basics. The system has pre-filled from the linked opportunity OPP-441.
        </p>
      </div>
      <div className="flex gap-4">
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">Customer</label>
          <input type="text" defaultValue="Xcel Energy" className={field} />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <label className="text-xs text-gray-500">Asset / units in scope *</label>
          <input type="text" defaultValue="HVDC Units S-12, S-14, S-19" className={field} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">Case type</label>
        {/* Toggle group - one segmented control, the picked option filled */}
        <div className="flex self-start">
          {CASE_TYPES.map((t, i) => (
            <button
              key={t}
              onClick={() => pickType(t)}
              aria-pressed={caseType === t}
              className={`h-8 px-2 text-sm text-gray-950 border-y border-r border-gray-200 transition-colors cursor-pointer ${
                i === 0 ? "border-l rounded-l-full" : ""
              } ${i === CASE_TYPES.length - 1 ? "rounded-r-full" : ""} ${caseType === t ? "bg-[#f5f5f5]" : "bg-white hover:bg-gray-50"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <label className="text-xs text-gray-500">What needs to happen?</label>
          <span className="text-[11px] text-gray-500 tracking-wider">Drafted from the case type</span>
        </div>
        <textarea
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          placeholder="Brief description of the fault or scope..."
          className="w-full h-24 px-2.5 py-2 text-sm text-gray-950 border border-gray-200 rounded-[10px] outline-none focus:border-gray-400 resize-none bg-white placeholder-gray-500"
        />
      </div>
    </div>
  );
}

/* ── Step 2: Scope & Access ──────────────────────────────────────── */
function StepScope() {
  const [urgency, setUrgency] = useState("High");
  const [workTypes, setWorkTypes] = useState(["Inspection", "Diagnostic testing"]);
  const [outage, setOutage] = useState("Yes - planned outage");
  /* What this customer has allowed before, so the planner starts from the
     pattern rather than a blank field. */
  const [window, setWindow] = useState(
    "Based on past trends: Xcel Energy usually allows access at Weekdays 08:00-16:00 with 2 weeks prior notice."
  );

  const workTypeOpts = [
    "Inspection", "Diagnostic testing", "Condition assessment", "Repair / replacement",
    "Parts installation", "Commissioning", "Monitoring setup", "Documentation / report",
  ];
  const outageOpts = ["Yes - planned outage", "No - live working", "Partial outage"];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h3 className="text-[28px] leading-[normal] text-gray-950 mb-1">Scope & access</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          What work is needed and what site constraints apply? The system has suggested scope based on the open field signals on this account.
        </p>
      </div>

      {/* Urgency */}
      <div>
        <label className="text-xs text-gray-500 mb-2 block">Urgency</label>
        <div className="flex gap-2 flex-wrap">
          {["Critical", "High", "Medium", "Low"].map((u) => (
            <button
              key={u}
              onClick={() => setUrgency(u)}
              className={`px-4 py-2 rounded-full text-sm cursor-pointer transition-colors ${
                urgency === u ? "bg-black text-white" : "border border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Work types needed */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">
          Work types needed <span className="text-gray-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">Select all that apply - pre-selected based on field signals</p>
        <div className="flex flex-wrap gap-2">
          {workTypeOpts.map((w) => {
            const active = workTypes.includes(w);
            return (
              <button
                key={w}
                onClick={() => setWorkTypes((p) => (active ? p.filter((x) => x !== w) : [...p, w]))}
                className={`px-3.5 py-2 rounded-full text-sm cursor-pointer transition-colors ${
                  active ? "bg-black text-white" : "border border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {w}
              </button>
            );
          })}
        </div>
      </div>

      {/* Outage required */}
      <div>
        <label className="text-xs text-gray-500 mb-2 block">Outage required?</label>
        <div className="flex gap-2 flex-wrap">
          {outageOpts.map((o) => (
            <button
              key={o}
              onClick={() => setOutage(o)}
              className={`px-4 py-2 rounded-full text-sm cursor-pointer transition-colors ${
                outage === o ? "bg-black text-white" : "border border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* Outage window */}
      <div>
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <label className="text-xs text-gray-500">Outage window</label>
          <span className="text-[11px] text-gray-500 tracking-wider">AI suggests</span>
        </div>
        <p className="text-xs text-gray-500 mb-2">When can the customer grant access? Any restricted periods?</p>
        <textarea
          value={window}
          onChange={(e) => setWindow(e.target.value)}
          placeholder="e.g. Weekdays 06:00–14:00 · 4-week customer notice required"
          className="w-full h-20 px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400 resize-none bg-white placeholder-gray-500"
        />
      </div>
    </div>
  );
}

/* ── Step 3: Staffing ────────────────────────────────────────────── */
interface StaffMember {
  id: string;
  name: string;
  role: string;
  skills: string;
  avail: string;
  img: string;
  conflict?: boolean;
}

const STAFF_DIRECTORY: Record<string, StaffMember> = {
  sara: { id: "sara", name: "Sara B.", role: "Field technician", skills: "HV competent", avail: "Available from 18 Aug", img: "/avatars/5.jpg" },
  dev: { id: "dev", name: "Dev K.", role: "Commissioning engineer", skills: "HVDC commissioning · IEC 62271", avail: "Available from 25 Aug", img: "/avatars/12.jpg" },
  liam: { id: "liam", name: "Liam O.", role: "Field technician", skills: "HV competent · Lifting supervisor", avail: "Committed until 24 Aug", conflict: true, img: "/avatars/13.jpg" },
  jordan: { id: "jordan", name: "Jordan P.", role: "Lead engineer", skills: "HV authorised · DGA certified", avail: "Available · no conflicts", img: "/avatars/14.jpg" },
  tom: { id: "tom", name: "Tom H.", role: "Reliability engineer", skills: "PD testing · Power factor", avail: "Available from 19 Aug", img: "/avatars/15.jpg" },
  kara: { id: "kara", name: "Kara M.", role: "HSE officer", skills: "Offshore BOSIET · Confined space", avail: "Available - no conflicts", img: "/avatars/9.jpg" },
};

function StaffCard({
  member,
  list,
  index,
  onDragStart,
  onDragOver,
  onDrop,
  dragging,
}: {
  member: StaffMember;
  list: "staffed" | "alt";
  index: number;
  onDragStart: (list: "staffed" | "alt", index: number) => void;
  onDragOver: (e: React.DragEvent, list: "staffed" | "alt", index: number) => void;
  onDrop: (list: "staffed" | "alt", index: number) => void;
  dragging: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(list, index)}
      onDragOver={(e) => onDragOver(e, list, index)}
      onDrop={() => onDrop(list, index)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-white transition-all cursor-grab active:cursor-grabbing ${
        member.conflict ? "border-gray-300 bg-gray-50" : "border-gray-200"
      } ${dragging ? "opacity-40 border-dashed" : "hover:border-gray-300"}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={member.img}
        alt={member.name}
        className="w-9 h-9 rounded-full object-cover bg-gray-200 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800">
          {member.name} <span className="text-gray-500">· {member.role}</span>
        </p>
        <p className="text-xs text-gray-500">{member.skills}</p>
        <p className={`text-xs ${member.conflict ? "text-gray-700 font-medium" : "text-gray-500"}`}>{member.avail}</p>
      </div>
      <GripVertical size={16} className="text-gray-500 shrink-0" />
    </div>
  );
}

function StepStaffing() {
  const [staffed, setStaffed] = useState<string[]>(["sara", "dev", "liam"]);
  const [alt, setAlt] = useState<string[]>(["jordan", "tom", "kara"]);
  const drag = useRef<{ list: "staffed" | "alt"; index: number } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const getList = (list: "staffed" | "alt") => (list === "staffed" ? staffed : alt);
  const setList = (list: "staffed" | "alt", next: string[]) =>
    list === "staffed" ? setStaffed(next) : setAlt(next);

  const onDragStart = (list: "staffed" | "alt", index: number) => {
    drag.current = { list, index };
    setDraggingId(getList(list)[index]);
  };

  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  const move = (toList: "staffed" | "alt", toIndex: number) => {
    const from = drag.current;
    if (!from) return;
    const fromArr = [...getList(from.list)];
    const [moved] = fromArr.splice(from.index, 1);
    if (moved == null) return;

    if (from.list === toList) {
      const insertAt = toIndex > from.index ? toIndex - 1 : toIndex;
      fromArr.splice(insertAt, 0, moved);
      setList(toList, fromArr);
    } else {
      const toArr = [...getList(toList)];
      toArr.splice(toIndex, 0, moved);
      setList(from.list, fromArr);
      setList(toList, toArr);
    }
    drag.current = null;
    setDraggingId(null);
  };

  const dropZoneProps = (list: "staffed" | "alt") => ({
    onDragOver,
    onDrop: () => move(list, getList(list).length),
  });

  const renderList = (list: "staffed" | "alt") =>
    getList(list).map((id, index) => (
      <StaffCard
        key={id}
        member={STAFF_DIRECTORY[id]}
        list={list}
        index={index}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={(l, i) => move(l, i)}
        dragging={draggingId === id}
      />
    ));

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h3 className="text-[28px] leading-[normal] text-gray-950 mb-1">Staffing</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          The system has checked availability and suggested the best-fit crew for this case type, scope, and site requirements. Confirm, swap, or add.
        </p>
      </div>

      {/* Staffed */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Staffed</p>
        <div className="flex flex-col gap-2 min-h-[8px]" {...dropZoneProps("staffed")}>
          {renderList("staffed")}
        </div>
      </div>

      {/* Alternative Staff */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Alternative Staff</p>
        <div className="flex flex-col gap-2 min-h-[8px]" {...dropZoneProps("alt")}>
          {renderList("alt")}
        </div>
      </div>

      {/* Add specialist */}
      <Button variant="outline" className="self-start gap-1.5 rounded-full h-auto px-4 py-2 text-sm text-gray-600 cursor-pointer">
Add specialist or sub-contractor not in system
      </Button>
    </div>
  );
}

/* ── Step 4: Parts & Materials ───────────────────────────────────── */
type StockKind = "in" | "low" | "out";

interface Part {
  name: string;
  code: string;
  qty: string;
  supplier: string;
  stock: string;
  stockKind: StockKind;
  lead: string;
  /** Set once the user takes one of the offered ways round a shortage. */
  resolvedWith?: string;
}

/** A way round a part that can't be supplied as scheduled. */
interface Fix {
  id: string;
  label: string;
  detail: string;
  /** What the part looks like once this fix is taken. */
  outcome: Pick<Part, "supplier" | "stock" | "stockKind" | "lead">;
}

/* Offered on any part that isn't sitting in stock. Each one is a real route a
   planner would take: pull from another store, swap in an approved equivalent,
   or pay to expedite. */
const FIXES: Record<string, Fix[]> = {
  "ERP-2288": [
    {
      id: "transfer",
      label: "Transfer the Blue Ridge spare",
      detail: "One set held at Blue Ridge stores, unallocated. Internal transfer clears in 4 days.",
      outcome: { supplier: "Blue Ridge stores", stock: "Transfer (1)", stockKind: "in", lead: "4d" },
    },
    {
      id: "substitute",
      label: "Substitute ERP-2290",
      detail: "Hitachi-approved equivalent, 6 in stock. Needs reliability sign-off on the gasket spec.",
      outcome: { supplier: "Hitachi factory", stock: "In stock (6)", stockKind: "in", lead: "Ready" },
    },
    {
      id: "expedite",
      label: "Expedite the factory order",
      detail: "Air freight instead of sea. Cuts the lead time to 12 days for about €8.4k.",
      outcome: { supplier: "Special order - air freight", stock: "On order", stockKind: "low", lead: "12d" },
    },
  ],
  "ERP-7783": [
    {
      id: "depot",
      label: "Source from the Nexans Milan depot",
      detail: "6 available locally. Depot transfer lands in 5 days instead of 14.",
      outcome: { supplier: "Nexans Milan depot", stock: "In stock (6)", stockKind: "in", lead: "5d" },
    },
    {
      id: "split",
      label: "Split the delivery",
      detail: "Take the 2 on hand for the first outage; the balance arrives on the original lead time.",
      outcome: { supplier: "Nexans", stock: "Part-shipped (2)", stockKind: "low", lead: "14d" },
    },
  ],
};

function StockBadge({ kind, label }: { kind: StockKind; label: string }) {
  const cls =
    kind === "out"
      ? "bg-status-critical-deep text-white font-bold"
      : kind === "low"
      ? "border border-status-warning text-amber-600 font-bold"
      : "bg-gray-100 text-gray-600";
  return <span className={`text-xs px-2 py-1 rounded-md whitespace-nowrap ${cls}`}>{label}</span>;
}

const INITIAL_PARTS: Part[] = [
  { name: "HVDC bushing assembly 400kV", code: "ERP-9921", qty: "3", supplier: "ABB Components", stock: "In stock (3)", stockKind: "in", lead: "Ready" },
  { name: "Insulating oil (inhibited) 25L drums", code: "ERP-4417", qty: "8", supplier: "Nynas AB", stock: "In stock (12)", stockKind: "in", lead: "Ready" },
  { name: "DGA sampling kit + reagents", code: "ERP-1104", qty: "3", supplier: "Internal stores", stock: "In stock (5)", stockKind: "in", lead: "Ready" },
  { name: "High-voltage cable terminations", code: "ERP-7783", qty: "6", supplier: "Nexans", stock: "Low (2)", stockKind: "low", lead: "14d" },
  { name: "Transformer gasket set (custom)", code: "ERP-2288", qty: "3", supplier: "Special order – Hitachi factory", stock: "Out of stock", stockKind: "out", lead: "35d" },
  { name: "Nitrogen blanket supply (cylinders)", code: "ERP-5530", qty: "4", supplier: "Air Liquide local depot", stock: "In stock (10)", stockKind: "in", lead: "Ready" },
];

/* The three that carry a signature or a border on this kind of job: the
   custom-built one, the one coming by air, and the hazardous one. */
const SIGN_OFF_PARTS = [
  "the transformer gasket set (ERP-2288)",
  "the HV cable terminations (ERP-7783)",
  "the nitrogen cylinders (ERP-5530)",
];

function StepParts() {
  const [parts, setParts] = useState<Part[]>(INITIAL_PARTS);
  // Which part's options are open, by code.
  const [openFix, setOpenFix] = useState<string | null>(null);
  /* The parts that have needed a customer signature or a customs declaration
     on past jobs - named, rather than left for the planner to work out. */
  const [signOff, setSignOff] = useState(
    `Based on historical trends, ${SIGN_OFF_PARTS.join(", ")} are likely to require customer sign-off and customs clearance.`
  );

  const setQty = (i: number, qty: string) =>
    setParts((prev) => prev.map((p, idx) => (idx === i ? { ...p, qty } : p)));
  const removePart = (i: number) => setParts((prev) => prev.filter((_, idx) => idx !== i));

  const applyFix = (code: string, fix: Fix) => {
    setParts((prev) => prev.map((p) => (p.code === code ? { ...p, ...fix.outcome, resolvedWith: fix.label } : p)));
    setOpenFix(null);
  };

  // The banner and summary read off the live list, so they settle as shortages
  // get resolved.
  const inStock = parts.filter((p) => p.stockKind === "in").length;
  const low = parts.filter((p) => p.stockKind === "low").length;
  const out = parts.filter((p) => p.stockKind === "out").length;
  const longest = parts.reduce((max, p) => {
    const days = parseInt(p.lead, 10);
    return Number.isNaN(days) ? max : Math.max(max, days);
  }, 0);
  const blocked = parts.filter((p) => p.stockKind === "out");
  const resolved = parts.filter((p) => p.resolvedWith);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h3 className="text-[28px] leading-[normal] text-gray-950 mb-1">Parts & materials</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          The system has checked ERP inventory for parts required based on the asset type and scope. Review stock status, override quantities, or add items.
        </p>
      </div>

      {/* Summary + whatever is still blocking the schedule */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <Info size={15} className="text-gray-500 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700 leading-snug">
            {inStock} parts in stock · {low} low stock · {out} to order
            {longest > 0 && ` · Longest lead time: ${longest} days`}
          </p>
        </div>

        {blocked.length > 0 ? (
          <div className="flex gap-3 bg-red-50 border border-status-critical/30 rounded-xl px-4 py-3">
            <AlertTriangle size={15} className="text-status-critical shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-800 leading-snug">
                {blocked.map((p) => p.name).join(", ")} {blocked.length > 1 ? "are" : "is"} out of stock at a{" "}
                {blocked[0].lead} lead time - the schedule can&apos;t hold as written.
              </p>
              <p className="text-sm text-gray-500 leading-snug">Open &ldquo;Resolve&rdquo; on the row for ways round it.</p>
            </div>
          </div>
        ) : (
          resolved.length > 0 && (
            <div className="flex gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <Check size={15} className="text-status-ok shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-800 leading-snug">Every shortage has a route round it.</p>
                <p className="text-sm text-gray-500 leading-snug">
                  {resolved.map((p) => `${p.name}: ${p.resolvedWith}`).join(" · ")}
                </p>
              </div>
            </div>
          )
        )}
      </div>

      {/* Parts table */}
      <div>
        {/* Head */}
        <div className="grid grid-cols-[1fr_auto_96px_92px_48px_28px] gap-x-3 px-1 pb-2 border-b border-gray-200 items-center">
          <span className="text-[11px] text-gray-500 tracking-wider">Part</span>
          <span className="text-[11px] text-gray-500 tracking-wider">Qty</span>
          <span className="text-[11px] text-gray-500 tracking-wider">Supplier</span>
          <span className="text-[11px] text-gray-500 tracking-wider">ERP stock</span>
          <span className="text-[11px] text-gray-500 tracking-wider">Lead</span>
          <span className="text-[11px] text-gray-500 tracking-wider text-right">OK</span>
        </div>
        {/* Rows */}
        {parts.map((p, i) => {
          const fixes = FIXES[p.code] ?? [];
          const needsFix = p.stockKind !== "in" && fixes.length > 0;
          const open = openFix === p.code;
          return (
            <div key={p.code} className="border-b border-gray-100">
              <div className="grid grid-cols-[1fr_auto_96px_92px_48px_28px] gap-x-3 px-1 py-3 items-center">
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.code}</p>
                </div>
                <input
                  value={p.qty}
                  onChange={(e) => setQty(i, e.target.value)}
                  className="w-9 h-8 text-center text-sm text-gray-800 border border-gray-200 rounded-full outline-none focus:border-gray-400"
                />
                <span className="text-xs text-gray-500 truncate">{p.supplier}</span>
                <StockBadge kind={p.stockKind} label={p.stock} />
                <span className={`text-xs ${p.stockKind === "out" ? "text-status-critical font-bold" : p.stockKind === "low" ? "text-gray-600" : "text-gray-500"}`}>
                  {p.lead}
                </span>
                <button
                  onClick={() => removePart(i)}
                  className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-600 transition-colors cursor-pointer justify-self-end"
                  aria-label={`Remove ${p.name}`}
                >
                  <X size={15} strokeWidth={1.5} />
                </button>
              </div>

              {/* A shortage is never a dead end - offer the ways round it */}
              {needsFix && (
                <div className="px-1 pb-3 -mt-1">
                  <button
                    onClick={() => setOpenFix(open ? null : p.code)}
                    aria-expanded={open}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-700 border border-gray-200 rounded-full px-3 py-1 hover:border-gray-400 transition-colors cursor-pointer"
                  >
                    {open ? "Hide options" : `Resolve · ${fixes.length} options`}
                  </button>

                  {open && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      {fixes.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => applyFix(p.code, f)}
                          className="text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2.5 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className="text-sm font-bold text-gray-900 leading-snug">{f.label}</span>
                            <span className="text-xs text-gray-500 shrink-0 whitespace-nowrap">
                              {f.outcome.lead === "Ready" ? "Ready now" : f.outcome.lead}
                            </span>
                          </span>
                          <span className="block text-xs text-gray-500 leading-relaxed mt-0.5">{f.detail}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {p.resolvedWith && (
                <p className="flex items-center gap-1.5 px-1 pb-3 -mt-1 text-xs text-gray-500">
                  <Check size={12} strokeWidth={2} className="text-status-ok shrink-0" />
                  {p.resolvedWith}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Add part */}
      <Button variant="outline" className="self-start gap-1.5 rounded-full h-auto px-4 py-2 text-sm text-gray-600 cursor-pointer">
Add part not in ERP
      </Button>

      {/* Notes */}
      <div>
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <label className="text-xs text-gray-500">Any parts requiring customer sign-off or import clearance?</label>
          <span className="text-[11px] text-gray-500 tracking-wider shrink-0">AI suggests</span>
        </div>
        <textarea
          value={signOff}
          onChange={(e) => setSignOff(e.target.value)}
          placeholder="Note any special handling, customer PO requirements, or customs declarations..."
          className="w-full h-20 px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400 resize-none bg-white placeholder-gray-500"
        />
      </div>
    </div>
  );
}

/* ── Step 5: Schedule ────────────────────────────────────────────── */
type EventType = "inspection" | "parts" | "field" | "report";

/* A colour each, so a month of dots can be read without the legend: blue for
   the inspections, amber for a delivery that can slip, violet for the crew on
   site, green for the report that closes it out. */
const COLOR_OF: Record<EventType, string> = {
  inspection: "#3b82f6",
  parts: "#f59e0b",
  field: "#a855f7",
  report: "#16a34a",
};

const EVENT_TYPES: { type: EventType; label: string; color: string }[] = [
  { type: "inspection", label: "Inspection", color: COLOR_OF.inspection },
  { type: "parts", label: "Parts delivery", color: COLOR_OF.parts },
  { type: "field", label: "Field work", color: COLOR_OF.field },
  { type: "report", label: "First report", color: COLOR_OF.report },
];

interface CalEvent {
  id: string;
  label: string;
  type: EventType;
  day: number; // date within August
}

const INITIAL_EVENTS: CalEvent[] = [
  { id: "e1", label: "Inspection visit", type: "inspection", day: 6 },
  { id: "e2", label: "Priya N. on site", type: "field", day: 6 },
  { id: "e3", label: "Tom H. on site", type: "field", day: 6 },
  { id: "e4", label: "Inspection visit", type: "inspection", day: 22 },
  { id: "e5", label: "Priya N. on site", type: "field", day: 22 },
  { id: "e6", label: "Tom H. on site", type: "field", day: 22 },
  { id: "e7", label: "Inspection (S-14)", type: "inspection", day: 23 },
  { id: "e8", label: "Kara M. on site", type: "field", day: 23 },
];

// August 2026 starts on a Saturday → Monday-first grid leads with Jul 27–31.
interface Cell {
  label: number;
  inMonth: boolean;
}
const CALENDAR_CELLS: Cell[] = [
  ...[27, 28, 29, 30, 31].map((d) => ({ label: d, inMonth: false })),
  ...Array.from({ length: 31 }, (_, i) => ({ label: i + 1, inMonth: true })),
  ...[1, 2, 3, 4, 5, 6].map((d) => ({ label: d, inMonth: false })),
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* The mobilization demo runs against the Sherco contract, so its customer-side
   contact is who the schedule goes to for confirmation. */
const SCHEDULE_CONTACT = OPS_CONTRACT_DETAILS["ct-sherco"]?.contacts[0];

function StepSchedule() {
  const [events, setEvents] = useState<CalEvent[]>(INITIAL_EVENTS);
  const dragId = useRef<string | null>(null);
  const [overDay, setOverDay] = useState<number | null>(null);
  const [sent, setSent] = useState(false);

  // The window the schedule spans, recomputed as events are dragged.
  const days = events.map((e) => e.day);
  const span = `${Math.min(...days)}-${Math.max(...days)} August 2026`;

  const moveEvent = (day: number) => {
    const id = dragId.current;
    if (id == null) return;
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, day } : e)));
    dragId.current = null;
    setOverDay(null);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h3 className="text-[28px] leading-[normal] text-gray-950 mb-1">Schedule</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          Milestones auto-placed from parts lead times and crew availability. Drag any event to change its date. Conflicts flagged in real time.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {EVENT_TYPES.map((t) => (
          <span key={t.type} className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: t.color }} />
            {t.label}
          </span>
        ))}
      </div>

      {/* Calendar */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* Nav */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
          <button className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm text-gray-800">August 2026</span>
          <button className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-[10px] text-gray-500 text-center py-1.5">{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {CALENDAR_CELLS.map((cell, i) => {
            const dayEvents = cell.inMonth ? events.filter((e) => e.day === cell.label) : [];
            const isOver = cell.inMonth && overDay === cell.label;
            return (
              <div
                key={i}
                onDragOver={(e) => {
                  if (!cell.inMonth) return;
                  e.preventDefault();
                  setOverDay(cell.label);
                }}
                onDragLeave={() => cell.inMonth && setOverDay((d) => (d === cell.label ? null : d))}
                onDrop={() => cell.inMonth && moveEvent(cell.label)}
                className={`min-h-[76px] border-b border-r border-gray-100 p-1 ${
                  i % 7 === 6 ? "border-r-0" : ""
                } ${isOver ? "bg-gray-100" : ""}`}
              >
                <div className={`text-[11px] px-1 ${cell.inMonth ? "text-gray-600" : "text-gray-500"}`}>
                  {cell.label}
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      draggable
                      onDragStart={() => (dragId.current = ev.id)}
                      title={ev.label}
                      className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded px-1 py-0.5 cursor-grab active:cursor-grabbing hover:border-gray-300 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: COLOR_OF[ev.type] }} />
                      <span className="text-[10px] text-gray-600 truncate">{ev.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Send the schedule to the customer for confirmation */}
      {sent ? (
        <div className="flex items-start gap-3 border border-gray-200 rounded-xl px-4 py-3">
          <span className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shrink-0 mt-0.5">
            <Check size={13} strokeWidth={2.5} className="text-white" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">Sent to {SCHEDULE_CONTACT?.name ?? "the customer"} for confirmation</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {events.length} events · {span}
              {SCHEDULE_CONTACT ? ` · ${SCHEDULE_CONTACT.email}` : ""}
            </p>
          </div>
          <button
            onClick={() => setSent(false)}
            className="shrink-0 text-xs text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            Undo
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">Confirm the window with the customer</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {events.length} events · {span}
              {SCHEDULE_CONTACT ? ` · ${SCHEDULE_CONTACT.name}, ${SCHEDULE_CONTACT.role}` : ""}
            </p>
          </div>
          <Button onClick={() => setSent(true)} className="rounded-full h-auto px-4 py-2 text-sm cursor-pointer shrink-0">
            Confirm with customer
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Wizard card (rendered as an AI message) ─────────────────────── */
function WizardCard({
  step,
  onContinue,
  onBack,
  onGenerate,
}: {
  step: number;
  onContinue: () => void;
  onBack: () => void;
  onGenerate: () => void;
}) {
  const isLast = step === 5;
  const isFirst = step === 1;

  return (
    <div className="bg-[#222222]/5 rounded-xl overflow-hidden">
      <StepTabs current={step} />

      {/* Step content - cross-fades when the step changes */}
      <div key={step} className="animate-step-in">
        {step === 1 && <StepCase />}
        {step === 2 && <StepScope />}
        {step === 3 && <StepStaffing />}
        {step === 4 && <StepParts />}
        {step === 5 && <StepSchedule />}
      </div>

      {/* Footer - Back (left) once past the first step, Continue (right) until the last */}
      {(!isFirst || !isLast) && (
        <div className="flex items-center justify-between p-6 border-t border-[#e5e5e5]/20">
          {!isFirst ? (
            <Button variant="outline" onClick={onBack} className="gap-1.5 rounded-full h-8 px-4 text-sm text-gray-700 cursor-pointer">
              Back
            </Button>
          ) : (
            <span />
          )}
          {isLast ? (
            <Button onClick={onGenerate} className="rounded-full h-8 px-4 text-sm font-bold cursor-pointer">
              Generate
            </Button>
          ) : (
            <Button onClick={onContinue} className="rounded-full h-8 px-4 text-sm font-bold cursor-pointer">
              Continue
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Lead creation wizard ────────────────────────────────────────── */
const OPP_STEP_DEFS = [
  { num: 1, label: "Account" },
  { num: 2, label: "Scope" },
  { num: 3, label: "Commercials" },
  { num: 4, label: "Review" },
];

function OppFieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-6 p-6">{children}</div>;
}
function OppHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h3 className="text-[28px] leading-[normal] text-gray-950 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 leading-[1.4]">{sub}</p>
    </div>
  );
}
function OppInput({ label, value, star }: { label: string; value: string; star?: boolean }) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1.5 block">
        {label} {star && <span className="text-gray-500">*</span>}
      </label>
      <input
        type="text"
        defaultValue={value}
        className="w-full h-9 px-3 text-sm border border-gray-200 rounded-full outline-none focus:border-gray-400 bg-white"
      />
    </div>
  );
}
function OppChips({ label, options, initial }: { label: string; options: string[]; initial: string }) {
  const [sel, setSel] = useState(initial);
  return (
    <div>
      <label className="text-xs text-gray-500 mb-2 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => setSel(o)}
            className={`px-4 py-2 rounded-full text-sm cursor-pointer transition-colors ${
              sel === o ? "bg-black text-white" : "border border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function OppStepAccount() {
  return (
    <OppFieldGroup>
      <OppHeader title="Account & lead" sub="Start with who the lead is for. The system has suggested details from portfolio signals." />
      <InfoBanner title="Suggested from portfolio signals" sub="Duke Energy fleet health is declining - a strong reliability-program candidate." />
      <div className="grid grid-cols-2 gap-3">
        <OppInput label="Customer" value="Duke Energy" star />
        <OppInput label="Region" value="North America" />
      </div>
      <OppInput label="Lead title" value="Fleet reliability program" star />
      <OppInput label="Estimated value" value="€5.4M" />
    </OppFieldGroup>
  );
}
function OppStepScope() {
  return (
    <OppFieldGroup>
      <OppHeader title="Scope & assets" sub="Define what the lead covers and which assets are involved." />
      <OppChips label="Lead type" options={["Service agreement", "Replacement", "Upgrade", "Retrofit"]} initial="Service agreement" />
      <OppInput label="Assets in scope" value="Fleet-wide · 12 converter stations" />
      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Technical requirements</label>
        <textarea
          placeholder="Summarise the scope of work and technical requirements..."
          defaultValue="Condition-based maintenance across the converter fleet, prioritising units with declining DGA and PD trends."
          className="w-full h-20 px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400 resize-none bg-white placeholder-gray-500"
        />
      </div>
    </OppFieldGroup>
  );
}
function OppStepCommercials() {
  return (
    <OppFieldGroup>
      <OppHeader title="Commercials" sub="Set the pricing approach and terms for the offer." />
      <OppChips label="Costing model" options={["Standard", "Premium", "Custom"]} initial="Premium" />
      <div className="grid grid-cols-2 gap-3">
        <OppInput label="Target margin" value="18%" />
        <OppInput label="Duration" value="5 years" />
      </div>
      <OppChips label="Payment terms" options={["Net 30", "Net 60", "Milestone-based"]} initial="Milestone-based" />
    </OppFieldGroup>
  );
}
function OppStepReview() {
  const rows = [
    { label: "Customer", value: "Duke Energy · North America" },
    { label: "Lead", value: "Fleet reliability program" },
    { label: "Value", value: "€5.4M · Premium · 18% margin" },
    { label: "Scope", value: "Service agreement · fleet-wide (12 stations)" },
    { label: "Entry stage", value: "Discovery" },
  ];
  return (
    <OppFieldGroup>
      <OppHeader title="Review & create" sub="Confirm the details - the lead will enter your pipeline at Discovery." />
      <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
        {rows.map((r, i) => (
          <div key={r.label} className={`flex items-start gap-4 px-4 py-3 ${i < rows.length - 1 ? "border-b border-gray-100" : ""}`}>
            <span className="text-xs text-gray-500 w-28 shrink-0 pt-0.5">{r.label}</span>
            <span className="text-sm text-gray-800 flex-1">{r.value}</span>
          </div>
        ))}
      </div>
    </OppFieldGroup>
  );
}

function OppWizardCard({
  step,
  onContinue,
  onBack,
  onCreate,
}: {
  step: number;
  onContinue: () => void;
  onBack: () => void;
  onCreate: () => void;
}) {
  const isLast = step === 4;
  const isFirst = step === 1;

  return (
    <div className="bg-[#222222]/5 rounded-xl overflow-hidden">
      <StepTabs current={step} steps={OPP_STEP_DEFS} />
      <div key={step} className="animate-step-in">
        {step === 1 && <OppStepAccount />}
        {step === 2 && <OppStepScope />}
        {step === 3 && <OppStepCommercials />}
        {step === 4 && <OppStepReview />}
      </div>
      <div className="flex items-center justify-between p-6 border-t border-[#e5e5e5]/20">
        {!isFirst ? (
          <Button variant="outline" onClick={onBack} className="gap-1.5 rounded-full h-8 px-4 text-sm text-gray-700 cursor-pointer">
            Back
          </Button>
        ) : (
          <span />
        )}
        {isLast ? (
          <Button onClick={onCreate} className="rounded-full h-8 px-4 text-sm font-bold cursor-pointer">
            Create lead
          </Button>
        ) : (
          <Button onClick={onContinue} className="rounded-full h-8 px-4 text-sm font-bold cursor-pointer">
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Generic data-driven guided flow ─────────────────────────────── */
function FlowFieldControl({ f }: { f: FlowField }) {
  if (f.type === "chips") {
    return <OppChips label={f.label} options={f.options ?? []} initial={f.value ?? f.options?.[0] ?? ""} />;
  }
  if (f.type === "textarea") {
    return (
      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">
          {f.label} {f.star && <span className="text-gray-500">*</span>}
        </label>
        <textarea
          defaultValue={f.value}
          className="w-full h-20 px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400 resize-none bg-white placeholder-gray-500"
        />
      </div>
    );
  }
  // text or date
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1.5 block">
        {f.label} {f.star && <span className="text-gray-500">*</span>}
      </label>
      <input
        type={f.type === "date" ? "date" : "text"}
        defaultValue={f.value}
        className="w-full h-9 px-3 text-sm border border-gray-200 rounded-full outline-none focus:border-gray-400 bg-white"
      />
    </div>
  );
}

function FlowHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h3 className="text-[28px] leading-[normal] text-gray-950 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 leading-[1.4]">{sub}</p>
    </div>
  );
}

function FlowWizardCard({
  flow,
  step,
  onContinue,
  onBack,
  onComplete,
}: {
  flow: GuidedFlow;
  step: number;
  onContinue: () => void;
  onBack: () => void;
  onComplete: () => void;
}) {
  const total = flow.steps.length + 1; // input steps + Review
  const stepDefs = [
    ...flow.steps.map((s, i) => ({ num: i + 1, label: s.label })),
    { num: total, label: "Review" },
  ];
  const isFirst = step === 1;
  const isLast = step === total;
  const current = flow.steps[step - 1];
  const reviewRows = flow.steps.flatMap((s) =>
    s.fields.filter((f) => f.value).map((f) => ({ label: f.label, value: f.value as string }))
  );

  return (
    <div className="bg-[#222222]/5 rounded-xl overflow-hidden">
      <StepTabs current={step} steps={stepDefs} />

      <div key={step} className="animate-step-in">
        {!isLast && current ? (
          <div className="flex flex-col gap-6 p-6">
            <FlowHeader title={current.title} sub={current.sub} />
            {current.banner && <InfoBanner title={current.banner.title} sub={current.banner.sub} />}
            <div className="grid grid-cols-2 gap-3">
              {current.fields.map((f) => (
                <div key={f.label} className={f.type === "chips" || f.type === "textarea" || f.full ? "col-span-2" : ""}>
                  <FlowFieldControl f={f} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 p-6">
            <FlowHeader title="Review & confirm" sub={`Confirm the details before you ${flow.cta.toLowerCase()}.`} />
            <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
              {reviewRows.map((r, i) => (
                <div key={`${r.label}-${i}`} className={`flex items-start gap-4 px-4 py-3 ${i < reviewRows.length - 1 ? "border-b border-gray-100" : ""}`}>
                  <span className="text-xs text-gray-500 w-32 shrink-0 pt-0.5">{r.label}</span>
                  <span className="text-sm text-gray-800 flex-1">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-6 border-t border-[#e5e5e5]/20">
        {!isFirst ? (
          <Button variant="outline" onClick={onBack} className="gap-1.5 rounded-full h-8 px-4 text-sm text-gray-700 cursor-pointer">
            Back
          </Button>
        ) : (
          <span />
        )}
        {isLast ? (
          <Button onClick={onComplete} className="rounded-full h-8 px-4 text-sm font-bold cursor-pointer">
            {flow.cta}
          </Button>
        ) : (
          <Button onClick={onContinue} className="rounded-full h-8 px-4 text-sm font-bold cursor-pointer">
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Context card (widget-launched conversations) ────────────────── */
function ContextCard({ context }: { context: string }) {
  return (
    <div className="mb-5 animate-message-in flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
        <BarChart2 size={15} strokeWidth={1.5} className="text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-500 tracking-wider">Context</p>
        <p className="text-sm text-gray-800 truncate">{context}</p>
      </div>
    </div>
  );
}

/* ── AI avatar ───────────────────────────────────────────────────── */
function AiAvatar() {
  return (
    <div className="size-8 rounded-full bg-[#222222]/5 flex items-center justify-center shrink-0">
      {/* The HMAX mark ships upright; turned a quarter it reads as the "H". */}
      <span className="flex items-center justify-center w-[14.856px] h-[13.193px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hmax-mark.svg" alt="" aria-hidden className="block max-w-none w-[13.193px] h-[14.856px] -rotate-90" />
      </span>
    </div>
  );
}

/* ── Chat thread ─────────────────────────────────────────────────── */
/** A task handed to a coworker who has been added to the conversation. */
export interface AssignedTask {
  assigneeId: string;
  assignee: string;
  role: string;
  avatar: string;
  title: string;
  /** ISO date, or "" when no date was set. */
  due: string;
  note?: string;
}

export interface ChatMsg {
  id: number;
  role: "user" | "ai";
  kind?: "text" | "wizard" | "opp-wizard" | "flow" | "panel" | "event" | "task" | "suggest-person";
  /** For kind === "flow": which guided flow to render. */
  flowId?: string;
  /** For kind === "panel": the interactive alert-playbook panel. */
  panel?: PlaybookPanel;
  /** For kind === "task": the assignment card. */
  task?: AssignedTask;
  /** For kind === "suggest-person": who to bring in, and why. */
  suggestion?: { personId: string; reason: string };
  text?: string;
  suggestions?: Suggestions;
  visual?: CustomWidgetConfig;
}

/** A conversation saved to the panel so it can be revisited. */
export interface StoredConversation {
  id: string;
  title: string;
  preview: string;
  date: string;
  context?: string;
  detectedCustomer?: string | null;
  /** The record this conversation is about (drives the left context pane). */
  entity?: ContextEntity;
  messages: ChatMsg[];
  /** Coworkers added to the conversation (people-data ids). */
  participantIds?: string[];
  /** For seed conversations with no thread yet: the prompt to run on open. */
  seedPrompt?: string;
}

/* What follows a reply, in two labelled categories: the follow-ups the user
   can keep pulling on, then HMAX's own recommendations. */
function SuggestionBlock({ suggestions, onSend }: { suggestions: Suggestions; onSend?: (t: string) => void }) {
  const { prompts, actions } = suggestions;
  if (prompts.length === 0 && actions.length === 0) return null;
  return (
    <div className="mt-3 ml-1 flex flex-col gap-3 animate-message-in">
      {prompts.length > 0 && (
        <SuggestionRow label={FOLLOW_UP_LABEL}>
          {prompts.map((p) => (
            <button
              key={p}
              onClick={() => onSend?.(p)}
              className="text-xs text-gray-600 border border-gray-200 rounded-full px-3 py-1.5 hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {p}
            </button>
          ))}
        </SuggestionRow>
      )}
      {actions.length > 0 && (
        <SuggestionRow label={RECOMMENDATION_LABEL}>
          {actions.map((a) => (
            <Button
              key={a.label}
              onClick={() => onSend?.(a.prompt)}
              className="rounded-full h-auto px-4 py-1.5 text-xs cursor-pointer"
            >
              {a.label}
            </Button>
          ))}
        </SuggestionRow>
      )}
    </div>
  );
}

/** One category: its heading, then what it offers inline underneath. */
function SuggestionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] text-gray-500 tracking-wider leading-4">{label}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/* ── Alert-playbook interactive panel ────────────────────────────── */
function PanelBlock({ panel, onSend, onOpenDoc, onUpdate }: { panel: PlaybookPanel; onSend?: (t: string) => void; onOpenDoc?: (doc: ViewDoc) => void; onUpdate?: (panel: PlaybookPanel) => void }) {
  if (panel.kind === "options") {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-4">
        <p className="text-sm text-gray-900 mb-1">{panel.heading}</p>
        {panel.note && <p className="text-xs text-gray-500 mb-3 leading-relaxed">{panel.note}</p>}
        <div className="flex flex-col gap-2">
          {panel.options.map((o) => (
            <div key={o.id} className={`rounded-xl border p-3 flex items-center gap-3 ${o.recommended ? "border-gray-900" : "border-gray-200"}`}>
              {o.avatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.avatar} alt={o.title} className="w-9 h-9 rounded-full object-cover bg-gray-200 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-900 truncate">{o.title}</p>
                  {o.recommended && <span className="text-[10px] text-gray-500 tracking-wider shrink-0">Recommended by HMAX</span>}
                </div>
                {o.subtitle && <p className="text-xs text-gray-500 truncate">{o.subtitle}</p>}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  {o.meta.map((m) => (
                    <span key={m.label} className="text-xs text-gray-500"><span className="text-gray-500">{m.label}:</span> {m.value}</span>
                  ))}
                </div>
                {o.tags && o.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {o.tags.map((t) => <span key={t} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>)}
                  </div>
                )}
              </div>
              <Button onClick={() => onSend?.(o.choosePrompt)} className="rounded-full h-auto px-4 py-1.5 text-xs cursor-pointer shrink-0">
                {o.chooseLabel}
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (panel.kind === "recap") {
    return <RecapPanel panel={panel} onOpenDoc={onOpenDoc} onUpdate={onUpdate} />;
  }

  if (panel.kind === "draft") {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-4">
        <p className="text-sm text-gray-900 mb-1">{panel.heading}</p>
        {panel.note && <p className="text-xs text-gray-500 mb-3 leading-relaxed">{panel.note}</p>}
        <textarea
          defaultValue={panel.value}
          className="w-full h-32 px-3 py-2.5 text-sm text-gray-700 border border-gray-200 rounded-xl outline-none focus:border-gray-400 resize-none bg-white leading-relaxed"
        />
        <Button onClick={() => onSend?.(panel.submitPrompt)} className="mt-3 rounded-full h-auto px-5 py-2 text-sm cursor-pointer">
          {panel.submitLabel}
        </Button>
      </div>
    );
  }

  // form
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4">
      <p className="text-sm text-gray-900 mb-1">{panel.heading}</p>
      {panel.note && <p className="text-xs text-gray-500 mb-3 leading-relaxed">{panel.note}</p>}
      <div className="flex flex-col gap-3">
        {panel.fields.map((f) => (
          <div key={f.label}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="text-xs text-gray-600">{f.label}</label>
              <span className="text-[11px] text-gray-500">Reach out to {f.owner}</span>
            </div>
            <input
              type="text"
              placeholder={f.placeholder}
              className="w-full h-9 px-3 text-sm border border-gray-200 rounded-full outline-none focus:border-gray-400 bg-white placeholder-gray-500"
            />
          </div>
        ))}
      </div>
      <Button onClick={() => onSend?.(panel.submitPrompt)} className="mt-3 rounded-full h-auto px-5 py-2 text-sm cursor-pointer">
        {panel.submitLabel}
      </Button>
    </div>
  );
}

/* A reviewed document, shown inline. Editable ones (e.g. a scope
   feasibility review) can be revised in place before sign-off. */
function RecapPanel({ panel, onOpenDoc, onUpdate }: { panel: Extract<PlaybookPanel, { kind: "recap" }>; onOpenDoc?: (doc: ViewDoc) => void; onUpdate?: (panel: PlaybookPanel) => void }) {
  const [editing, setEditing] = useState(false);
  const canEdit = !!panel.doc && !!panel.editable && !!onUpdate;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-sm text-gray-900">{panel.heading}</p>
        {panel.doc && !editing && (
          <div className="flex items-center gap-3 shrink-0">
            {canEdit && (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                Edit
              </button>
            )}
            {onOpenDoc && (
              <button onClick={() => onOpenDoc(panel.doc!)} className="text-xs text-gray-600 underline underline-offset-2 decoration-gray-300 hover:decoration-gray-700 cursor-pointer">
                Open full document
              </button>
            )}
          </div>
        )}
      </div>
      {panel.doc && editing ? (
        <DocEditor
          doc={panel.doc}
          onCancel={() => setEditing(false)}
          onSave={(doc) => {
            setEditing(false);
            onUpdate?.({ ...panel, doc, rows: doc.fields });
          }}
        />
      ) : panel.doc ? (
        // Show the document content inline in the conversation.
        <DocContent doc={panel.doc} />
      ) : (
        <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
          {panel.rows.map((r, i) => (
            <div key={r.label} className={`flex items-start gap-4 px-4 py-2.5 ${i < panel.rows.length - 1 ? "border-b border-gray-100" : ""}`}>
              <span className="text-xs text-gray-500 w-32 shrink-0 pt-0.5">{r.label}</span>
              <span className="text-sm text-gray-800 flex-1">{r.value}</span>
            </div>
          ))}
        </div>
      )}
      {panel.note && <p className="text-xs text-gray-500 mt-2.5">{panel.note}</p>}
    </div>
  );
}

/* ── A coworker the assistant suggests bringing in ───────────────── */
function PersonSuggestionCard({ suggestion, added, onAdd }: { suggestion: { personId: string; reason: string }; added: boolean; onAdd?: (personId: string) => void }) {
  const person = ALL_PEOPLE.find((p) => p.id === suggestion.personId);
  if (!person) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
        <UserRoundPlus size={14} strokeWidth={1.5} className="text-gray-500 shrink-0" />
        <p className="text-xs text-gray-500">Teammate recommended by HMAX</p>
      </div>
      <div className="px-4 py-3 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={person.avatar} alt="" aria-hidden className="w-9 h-9 rounded-full object-cover bg-gray-200 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 truncate">{person.name} · {person.role}</p>
          <p className="text-xs text-gray-500 leading-relaxed">{suggestion.reason}</p>
        </div>
        {added ? (
          <span className="shrink-0 flex items-center gap-1 text-xs text-gray-500">
            <Check size={13} strokeWidth={1.5} /> Added
          </span>
        ) : (
          <Button onClick={() => onAdd?.(person.id)} className="rounded-full h-auto px-4 py-1.5 text-xs cursor-pointer shrink-0">
            Add to conversation
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Participant joined / left ───────────────────────────────────── */
function EventLine({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 mb-5 animate-message-in">
      <hr className="flex-1 border-gray-200" />
      <p className="text-xs text-gray-500 shrink-0">{text}</p>
      <hr className="flex-1 border-gray-200" />
    </div>
  );
}

/* ── An assigned task ────────────────────────────────────────────── */
function TaskCard({ task }: { task: AssignedTask }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
        <ClipboardCheck size={14} strokeWidth={1.5} className="text-gray-500 shrink-0" />
        <p className="text-xs text-gray-500">Task assigned</p>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm text-gray-900 leading-snug mb-2">{task.title}</p>
        {task.note && <p className="text-sm text-gray-500 leading-relaxed mb-3">{task.note}</p>}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-2 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={task.avatar} alt="" aria-hidden className="w-6 h-6 rounded-full object-cover bg-gray-200 shrink-0" />
            <span className="min-w-0">
              <span className="block text-xs text-gray-700 truncate">{task.assignee}</span>
              <span className="block text-[11px] text-gray-500 truncate">{task.role}</span>
            </span>
          </span>
          {task.due && (
            <span className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap">
              <CalendarClock size={13} strokeWidth={1.5} className="text-gray-500" />
              Due {task.due}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface ThreadProps {
  messages: ChatMsg[];
  typing: boolean;
  context?: string;
  wizardStep: number;
  onWizardStep: (n: number) => void;
  onGenerate: () => void;
  onOppCreate?: () => void;
  onFlowComplete?: (flowId: string) => void;
  onOpenDoc?: (doc: ViewDoc) => void;
  onSend?: (text: string) => void;
  /** Replace a playbook panel in place (e.g. after editing its document). */
  onUpdatePanel?: (messageId: number, panel: PlaybookPanel) => void;
  /** Who is already in the conversation, and how to add someone. */
  participantIds?: string[];
  onAddPerson?: (personId: string) => void;
}

export function ChatThread({ messages, typing, context, wizardStep, onWizardStep, onGenerate, onOppCreate, onFlowComplete, onOpenDoc, onSend, onUpdatePanel, participantIds = [], onAddPerson }: ThreadProps) {
  // Follow-ups and recommendations sit under the newest reply that carries
  // them - a panel, task card or teammate suggestion pushed after the answer
  // shouldn't take them away.
  const lastSuggestionId = messages.filter((m) => m.suggestions).at(-1)?.id;

  // Assistant turns: the HMAX avatar, then the content, kept clear of the
  // right edge so they read as the other side of the conversation.
  const aiRow = (key: number, children: React.ReactNode) => (
    <div key={key} className="flex items-start gap-2.5 pr-8 mb-6 animate-message-in">
      <AiAvatar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );

  return (
    <>
      {/* Widget context pinned to the top */}
      {context && <ContextCard context={context} />}

      {messages.map((m) =>
        m.kind === "event" ? (
          <EventLine key={m.id} text={m.text ?? ""} />
        ) : m.kind === "suggest-person" && m.suggestion ? (
          aiRow(
            m.id,
            <PersonSuggestionCard
              suggestion={m.suggestion}
              added={participantIds.includes(m.suggestion.personId)}
              onAdd={onAddPerson}
            />
          )
        ) : m.kind === "task" && m.task ? (
          aiRow(m.id, <TaskCard task={m.task} />)
        ) : m.role === "user" ? (
          <div key={m.id} className="flex items-start justify-end gap-2.5 pl-10 mb-6 animate-message-in">
            <div className="flex-1 min-w-0 bg-[#222222]/5 rounded-xl p-4">
              <p className="text-sm leading-5 text-gray-950 whitespace-pre-line">{m.text}</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/avatars/68.jpg" alt="Jan V." className="size-8 rounded-full object-cover bg-[#f5f5f5] shrink-0" />
          </div>
        ) : m.kind === "wizard" ? (
          aiRow(
            m.id,
            <WizardCard
              step={wizardStep}
              onContinue={() => onWizardStep(Math.min(5, wizardStep + 1))}
              onBack={() => onWizardStep(Math.max(1, wizardStep - 1))}
              onGenerate={onGenerate}
            />
          )
        ) : m.kind === "opp-wizard" ? (
          aiRow(
            m.id,
            <OppWizardCard
              step={wizardStep}
              onContinue={() => onWizardStep(Math.min(4, wizardStep + 1))}
              onBack={() => onWizardStep(Math.max(1, wizardStep - 1))}
              onCreate={() => onOppCreate?.()}
            />
          )
        ) : m.kind === "flow" ? (
          (() => {
            const flow = flowById(m.flowId);
            if (!flow) return null;
            const total = flow.steps.length + 1;
            return aiRow(
              m.id,
              <FlowWizardCard
                flow={flow}
                step={wizardStep}
                onContinue={() => onWizardStep(Math.min(total, wizardStep + 1))}
                onBack={() => onWizardStep(Math.max(1, wizardStep - 1))}
                onComplete={() => onFlowComplete?.(flow.id)}
              />
            );
          })()
        ) : m.kind === "panel" && m.panel ? (
          aiRow(
            m.id,
            <PanelBlock panel={m.panel} onSend={onSend} onOpenDoc={onOpenDoc} onUpdate={onUpdatePanel ? (p) => onUpdatePanel(m.id, p) : undefined} />
          )
        ) : (
          aiRow(
            m.id,
            <>
              <div className="bg-[#222222]/5 rounded-xl p-4 flex flex-col gap-4">
                <p className="text-sm leading-5 text-gray-950 whitespace-pre-line">{m.text}</p>
                {/* A chart answer sits in its own white card inside the reply */}
                {m.visual && (
                  <div className="bg-white border border-gray-200 rounded-[10px] p-6 flex flex-col gap-4">
                    <p className="text-sm font-bold leading-5 text-gray-950">{m.visual.title}</p>
                    <ChartBody config={m.visual} />
                  </div>
                )}
              </div>
              {/* Proactive suggestions - under the newest reply that has any, so a
                  trailing panel or task card doesn't swallow them */}
              {m.id === lastSuggestionId && !typing && m.suggestions && (
                <SuggestionBlock suggestions={m.suggestions} onSend={onSend} />
              )}
            </>
          )
        )
      )}

      {typing && <TypingBubble />}
    </>
  );
}
