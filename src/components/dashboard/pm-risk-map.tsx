"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Loader2, Store, TriangleAlert, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import StaticMap from "@/components/dashboard/static-map";
import { TabGroup } from "@/components/dashboard/filter-controls";
import AttentionDrawer from "@/components/dashboard/attention-drawer";
import ContractDrawer from "@/components/dashboard/operations/contract-drawer";
import SlaContractDrawer from "@/components/dashboard/sales/sla-contract-drawer";
import { resolveContract } from "@/lib/contract-lookup";
import { CHART } from "@/lib/chart-theme";
import { CUSTOMER_DETAILS, PM_ALERT_TYPES, type PmAlertType } from "@/lib/dashboard-data";
import { PM_SITES, READINESS_ITEMS, hoursBetween, hoursLabel, shortDate, type AltSupplier, type LatePart, type PmSite, type Point } from "@/lib/pm-map-data";

/* ── PM delivery map ─────────────────────────────────────────────────
   Contract sites filtered by risk type. A late part's shipment is drawn with
   the traffic disruption holding it up. From there the PM can contact the
   carrier (reroute or confirm a revised ETA) or explore local suppliers that
   could protect the schedule instead. */

/* Readiness chips - blocked and pending read loud, ready reads quiet. */
const READINESS_CLS: Record<string, string> = {
  ready: "bg-gray-100 text-gray-600",
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  blocked: "bg-status-critical text-white font-bold",
};

/** Hours early (negative) or late (positive) against when the part is needed. */
const slip = (part: LatePart, arrives: string) => hoursBetween(part.neededBy, arrives);

function SlipBadge({ hours }: { hours: number }) {
  const late = hours > 0;
  const label = hours === 0 ? "On time" : `${hoursLabel(hours)} ${late ? "late" : "early"}`;
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 font-bold ${
        late ? "bg-status-critical text-white" : "bg-green-50 text-green-700 border border-green-200"
      }`}
    >
      {label}
    </span>
  );
}

/** How a late part's risk has been handled. */
type Resolution =
  | { kind: "awaiting"; request: Request }
  | { kind: "rerouted" }
  | { kind: "eta-confirmed" }
  | { kind: "supplier"; supplierId: string };

type Request = "reroute" | "confirm";

type Pin = {
  id: string;
  x: number;
  y: number;
  label: string;
  ping?: boolean;
  site?: PmSite;
  truck?: PmSite;
  disruption?: PmSite;
  supplier?: AltSupplier;
};

const REQUESTS: { id: Request; label: string }[] = [
  { id: "reroute", label: "Reroute around it" },
  { id: "confirm", label: "Confirm revised ETA" },
];

function draftMessage(part: LatePart, request: Request) {
  const { shipment, disruption, reroute } = part;
  const first = shipment.contact.name.split(" ")[0];
  return request === "reroute"
    ? `Hi ${first}, our ${part.name} (${part.code}) is caught in the ${disruption.title}. It has to be on site by ${shortDate(part.neededBy)}. Can you reroute via the ${reroute.via} and confirm the new ETA?`
    : `Hi ${first}, our ${part.name} (${part.code}) is caught in the ${disruption.title}. Can you confirm the revised ETA to site? We need it by ${shortDate(part.neededBy)}.`;
}

const line = (points: Point[]) => points.map(([x, y]) => `${x},${y}`).join(" ");

export default function PmRiskMap() {
  const [risk, setRisk] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // The site whose late part is being worked, and how.
  const [flow, setFlow] = useState<{ siteId: string; kind: "contact" | "supplier" } | null>(null);
  const [request, setRequest] = useState<Request>("reroute");
  const [message, setMessage] = useState("");
  const [chosenSupplier, setChosenSupplier] = useState<string | null>(null);
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({});

  // The detail drawer open from a tooltip: the attention record where one
  // exists, otherwise the contract that covers the site.
  const [detail, setDetail] = useState<{ kind: "attention" | "ops" | "sla"; id: string } | null>(null);
  const openDetails = (s: PmSite) => {
    if (CUSTOMER_DETAILS[s.id]) return setDetail({ kind: "attention", id: s.id });
    const ref = resolveContract(s.contract, s.customer);
    if (ref) setDetail(ref);
  };
  const detailsButton = (s: PmSite) => (
    <button
      onClick={() => openDetails(s)}
      className="w-full text-xs text-gray-700 border border-gray-200 rounded-full py-1.5 hover:border-gray-400 transition-colors cursor-pointer"
    >
      View details
    </button>
  );

  const site = flow ? PM_SITES.find((s) => s.id === flow.siteId) ?? null : null;
  const part = site?.latePart;

  // The carrier "replies" a moment after the message goes.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  /** When the part now reaches site, given what's been done about it. */
  const arrival = (s: PmSite) => {
    const p = s.latePart!;
    const r = resolutions[s.id];
    if (r?.kind === "rerouted") return p.reroute.eta;
    if (r?.kind === "supplier") return p.suppliers.find((x) => x.id === r.supplierId)?.arrives ?? p.shipment.revisedEta;
    return p.shipment.revisedEta;
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PM_SITES.filter(
      (s) =>
        (risk === "all" || s.risks.includes(risk as PmAlertType)) &&
        (!q ||
          [s.contract, s.customer, s.latePart?.name, s.latePart?.code, s.latePart?.shipment.carrier, ...s.flags.map((f) => f.title)].some((v) =>
            v?.toLowerCase().includes(q)
          ))
    );
  }, [risk, query]);

  // Part shipments are drawn for the Spare parts view, or for the site whose tooltip is open.
  const showShipment = (s: PmSite) =>
    !!s.latePart && resolutions[s.id]?.kind !== "supplier" && (risk === "Spare parts" || selectedId === s.id || selectedId?.endsWith(`:${s.id}`));

  const pins: Pin[] = (() => {
    if (site && part && flow?.kind === "supplier") {
      return [
        { id: site.id, x: site.x, y: site.y, label: site.contract, site },
        ...part.suppliers.map((sup) => ({ id: `supplier:${sup.id}`, x: sup.x, y: sup.y, label: sup.name, supplier: sup })),
      ];
    }
    if (site && part && flow?.kind === "contact") {
      return [
        { id: site.id, x: site.x, y: site.y, label: site.contract, site },
        { id: `truck:${site.id}`, x: part.shipment.x, y: part.shipment.y, label: part.shipment.carrier, truck: site },
        { id: `disruption:${site.id}`, x: part.disruption.x, y: part.disruption.y, label: part.disruption.title, disruption: site },
      ];
    }
    return visible.flatMap((s) => {
      const out: Pin[] = [{ id: s.id, x: s.x, y: s.y, label: s.contract, ping: s.status === "critical", site: s }];
      if (s.latePart && showShipment(s)) {
        out.push({ id: `truck:${s.id}`, x: s.latePart.shipment.x, y: s.latePart.shipment.y, label: s.latePart.shipment.carrier, truck: s });
        if (resolutions[s.id]?.kind !== "rerouted") {
          out.push({ id: `disruption:${s.id}`, x: s.latePart.disruption.x, y: s.latePart.disruption.y, label: s.latePart.disruption.title, disruption: s });
        }
      }
      return out;
    });
  })();

  /* ── Flows ── */
  const startContact = (s: PmSite) => {
    if (!s.latePart) return;
    setFlow({ siteId: s.id, kind: "contact" });
    setRequest("reroute");
    setMessage(draftMessage(s.latePart, "reroute"));
    setSelectedId(null);
  };
  const startSupplier = (s: PmSite) => {
    setFlow({ siteId: s.id, kind: "supplier" });
    setChosenSupplier(s.latePart?.suppliers.find((x) => x.recommended)?.id ?? null);
    setSelectedId(null);
  };
  const closeFlow = () => {
    const id = flow?.siteId ?? null;
    setFlow(null);
    setSelectedId(id);
  };
  const sendMessage = () => {
    if (!flow) return;
    const siteId = flow.siteId;
    const req = request;
    setResolutions((r) => ({ ...r, [siteId]: { kind: "awaiting", request: req } }));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setResolutions((r) => ({ ...r, [siteId]: req === "reroute" ? { kind: "rerouted" } : { kind: "eta-confirmed" } }));
    }, 2500);
  };
  const reserveStock = () => {
    if (!flow || !chosenSupplier) return;
    setResolutions((r) => ({ ...r, [flow.siteId]: { kind: "supplier", supplierId: chosenSupplier } }));
    closeFlow();
  };

  /* ── Tooltips ── */
  const partBlock = (s: PmSite, p: LatePart) => {
    const r = resolutions[s.id];
    const fixed = r?.kind === "rerouted" || r?.kind === "supplier";
    const supplier = r?.kind === "supplier" ? p.suppliers.find((x) => x.id === r.supplierId) : null;
    return (
      <div className={`rounded-lg border p-3 flex flex-col gap-2 ${fixed ? "bg-green-50 border-green-200" : "bg-[#fff1f2] border-[#fee2e2]"}`}>
        <div className="flex items-center justify-between gap-2">
          <p className={`flex items-center gap-1.5 text-[11px] font-bold ${fixed ? "text-green-700" : "text-status-critical"}`}>
            {fixed ? <Check size={12} className="shrink-0" /> : <TriangleAlert size={12} className="shrink-0" />}
            {r?.kind === "rerouted" ? "Carrier rerouted" : supplier ? "Sourced locally" : "Traffic disruption"}
          </p>
          {fixed ? (
            <SlipBadge hours={slip(p, arrival(s))} />
          ) : (
            <span className="text-[10px] font-bold text-white bg-status-critical rounded-full px-2 py-0.5 whitespace-nowrap shrink-0">
              {hoursLabel(slip(p, arrival(s)))} late
            </span>
          )}
        </div>

        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">{p.name}</p>
            <p className="text-xs text-gray-500">
              {p.code} · {p.supplier}
            </p>
          </div>
          <p className="text-xs text-gray-400 whitespace-nowrap">X{p.qty}</p>
        </div>

        {supplier && (
          <p className="text-xs text-gray-600">
            {supplier.name} · {supplier.stock} · on site {shortDate(supplier.arrives)}
          </p>
        )}
        {r?.kind === "rerouted" && (
          <p className="text-xs text-gray-600">
            {p.shipment.carrier} rerouted via the {p.reroute.via} · on site {shortDate(p.reroute.eta)}
          </p>
        )}
        {r?.kind === "awaiting" && (
          <p className="flex items-center gap-1.5 text-xs text-gray-600">
            <Loader2 size={13} className="animate-spin" /> Waiting on {p.shipment.carrier} to reply
          </p>
        )}
        {r?.kind === "eta-confirmed" && (
          <p className="text-xs text-gray-600">
            {p.shipment.carrier} confirmed {shortDate(p.shipment.revisedEta)} - still late.
          </p>
        )}

        {!fixed && (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => startContact(s)}
              className="w-full rounded-full bg-status-critical hover:opacity-90 py-1.5 text-xs font-bold text-white transition-opacity cursor-pointer"
            >
              Contact existing carrier
            </button>
            <button
              onClick={() => startSupplier(s)}
              className="w-full rounded-full bg-white border border-gray-200 hover:border-gray-400 py-1.5 text-xs font-bold text-gray-800 transition-colors cursor-pointer"
            >
              Explore alternative supplier
            </button>
          </div>
        )}
      </div>
    );
  };

  const siteTip = (s: PmSite) => {
    const showPart = s.latePart && (risk === "all" || risk === "Spare parts");
    const flags = (risk === "all" ? s.flags : s.flags.filter((f) => f.type === risk)).filter((f) => f.type !== "Spare parts" || !showPart);
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-snug">{s.contract}</p>
            <p className="text-xs text-gray-400 truncate">{s.customer}</p>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
              s.status === "critical" ? "bg-status-critical text-white font-bold" : "border border-gray-300 text-gray-500"
            }`}
          >
            {s.status === "critical" ? "Critical" : "At risk"}
          </span>
        </div>

        {/* The disruption leads - it's what needs a decision */}
        {showPart && s.latePart && partBlock(s, s.latePart)}

        <div>
          <p className="text-[10px] text-gray-400 tracking-wider mb-1">Risks</p>
          <div className="flex flex-wrap gap-1.5">
            {s.risks.map((t) => (
              <span key={t} className={`text-[10px] px-2 py-0.5 rounded-full ${t === risk ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}>
                {t}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] text-gray-400 tracking-wider mb-1">Readiness</p>
          <div className="flex flex-wrap gap-1.5">
            {READINESS_ITEMS.map((item) => (
              <span key={item} className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${READINESS_CLS[s.readiness[item]]}`}>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* What is riding on it commercially */}
        {s.value && (
          <div>
            <p className="text-[10px] text-gray-400 tracking-wider mb-1">Business impact</p>
            <p className="text-xs text-gray-600">{s.value} contract value</p>
          </div>
        )}

        {flags.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {flags.map((f) => (
              <li key={f.title} className="text-xs text-gray-600 leading-snug">
                {f.title}
              </li>
            ))}
          </ul>
        )}


        <button
          onClick={() => openDetails(s)}
          className="w-full text-xs text-gray-700 border border-gray-200 rounded-full py-1.5 hover:border-gray-400 transition-colors cursor-pointer"
        >
          View details
        </button>
      </div>
    );
  };

  const truckTip = (s: PmSite) => {
    const p = s.latePart!;
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start gap-2.5">
          <span className="size-8 rounded-full bg-gray-900 text-white flex items-center justify-center shrink-0">
            <Truck size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900 leading-snug">{p.shipment.carrier}</p>
            <p className="text-xs text-gray-400">
              {p.shipment.mode} · {p.name} ×{p.qty}
            </p>
          </div>
          <SlipBadge hours={slip(p, arrival(s))} />
        </div>
        <p className="text-xs text-gray-600">
          {p.shipment.contact.name}, {p.shipment.contact.role} · {p.shipment.contact.phone}
        </p>
        <p className="text-xs text-gray-600">
          On site {shortDate(arrival(s))} · needed {shortDate(p.neededBy)}
        </p>
      </div>
    );
  };

  const disruptionTip = (s: PmSite) => {
    const p = s.latePart!;
    return (
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 text-sm font-bold text-status-critical">
          <TriangleAlert size={14} className="shrink-0" />
          {p.disruption.title}
        </p>
        <p className="text-xs text-gray-600 leading-snug">{p.disruption.detail}</p>
        <p className="text-xs text-gray-600">
          {p.shipment.carrier} now lands {shortDate(p.shipment.revisedEta)}, {hoursLabel(hoursBetween(p.shipment.plannedEta, p.shipment.revisedEta))} later than planned.
        </p>
      </div>
    );
  };

  const supplierTip = (sup: AltSupplier) => (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-start gap-2.5">
        <span className="size-8 rounded-full bg-gray-900 text-white flex items-center justify-center shrink-0">
          <Store size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900 leading-snug">{sup.name}</p>
          <p className="text-xs text-gray-400">
            {sup.location} · {sup.stock}
          </p>
        </div>
      </div>
      {part && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-900">
            On site {shortDate(sup.arrives)} · {sup.cost}
          </p>
          <SlipBadge hours={slip(part, sup.arrives)} />
        </div>
      )}
      <p className="text-xs text-gray-500 leading-snug">{sup.note}</p>
      <Button
        onClick={() => {
          setChosenSupplier(sup.id);
          setSelectedId(null);
        }}
        variant={chosenSupplier === sup.id ? "outline" : "default"}
        className="rounded-full h-8 text-xs font-bold cursor-pointer"
      >
        {chosenSupplier === sup.id ? "Selected" : "Choose this supplier"}
      </Button>
      {site && detailsButton(site)}
    </div>
  );

  /* ── Pins ── */
  const chip = (x: number, children: React.ReactNode, dark = false) => (
    <span
      className={`absolute ${x > 70 ? "right-full mr-1.5" : "left-full ml-1.5"} whitespace-nowrap rounded-full shadow px-2 py-0.5 text-[11px] flex items-center gap-1.5 ${
        dark ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      }`}
    >
      {children}
    </span>
  );

  const renderPin = (pin: Pin, selected: boolean) => {
    const ring = selected ? "ring-2 ring-gray-900 ring-offset-2" : "";
    if (pin.truck) {
      const s = pin.truck;
      const late = slip(s.latePart!, arrival(s)) > 0;
      return (
        <span className="relative flex items-center">
          <span className={`relative size-8 rounded-full flex items-center justify-center shadow-md bg-white text-gray-900 border border-gray-300 ${ring}`}>
            <Truck size={15} />
          </span>
          {chip(
            pin.x,
            <>
              <span className={`size-1.5 rounded-full ${late ? "bg-status-critical" : "bg-green-500"}`} />
              {s.latePart!.shipment.carrier} · {shortDate(arrival(s))}
            </>
          )}
        </span>
      );
    }
    if (pin.disruption) {
      return (
        <span className="relative flex items-center">
          <span className={`relative size-7 rounded-full flex items-center justify-center shadow-md bg-status-critical text-white ${ring}`}>
            <TriangleAlert size={14} />
          </span>
        </span>
      );
    }
    if (pin.supplier && part) {
      const sup = pin.supplier;
      const active = chosenSupplier === sup.id;
      const late = slip(part, sup.arrives) > 0;
      return (
        <span className="relative flex items-center">
          <span
            className={`relative size-8 rounded-full flex items-center justify-center shadow-md transition-transform ${
              active ? "bg-gray-900 text-white scale-110" : "bg-white text-gray-900 border border-gray-300"
            } ${ring}`}
          >
            <Store size={15} />
          </span>
          {chip(
            pin.x,
            <>
              <span className={`size-1.5 rounded-full ${late ? "bg-status-critical" : "bg-green-500"}`} />
              {sup.stock} · {shortDate(sup.arrives)}
            </>
          )}
        </span>
      );
    }
    if (flow && pin.site && part) {
      // The destination while working the part.
      return (
        <span className="relative flex items-center">
          <span className="absolute inline-flex size-10 -left-3 rounded-full bg-gray-900/15 animate-ping [animation-duration:2.5s]" />
          <span className="relative size-4 rounded-full bg-gray-900 border-2 border-white shadow" />
          {chip(pin.x, <>Site · needed {shortDate(part.neededBy)}</>, true)}
        </span>
      );
    }
    return undefined;
  };

  /* ── Routes ── */
  const routeLine = (key: string, points: Point[], style: "late" | "active" | "option") => (
    <polyline
      key={key}
      points={line(points)}
      fill="none"
      stroke={style === "late" ? "#FA000F" : style === "active" ? CHART.line : "#737373"}
      strokeWidth={style === "option" ? 2.5 : 4}
      strokeOpacity={style === "option" ? 0.6 : 0.9}
      strokeDasharray={style === "active" ? undefined : "6 6"}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
    />
  );

  const routes = (() => {
    const lines: React.ReactNode[] = [];
    if (site && part && flow?.kind === "supplier") {
      part.suppliers.forEach((sup) => lines.push(routeLine(sup.id, sup.route, chosenSupplier === sup.id ? "active" : "option")));
    } else if (site && part && flow?.kind === "contact") {
      const r = resolutions[site.id];
      lines.push(routeLine("current", part.shipment.route, r?.kind === "rerouted" ? "option" : "late"));
      lines.push(routeLine("reroute", part.reroute.route, r?.kind === "rerouted" || request === "reroute" ? "active" : "option"));
    } else {
      visible.forEach((s) => {
        const p = s.latePart;
        const r = resolutions[s.id];
        if (p && r?.kind === "supplier") {
          const sup = p.suppliers.find((x) => x.id === r.supplierId);
          if (sup && (risk === "Spare parts" || selectedId === s.id)) lines.push(routeLine(`${s.id}-sup`, sup.route, "active"));
        } else if (p && showShipment(s)) {
          lines.push(routeLine(`${s.id}-ship`, r?.kind === "rerouted" ? p.reroute.route : p.shipment.route, r?.kind === "rerouted" ? "active" : "late"));
        }
      });
    }
    return lines.length ? (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
        {lines}
      </svg>
    ) : null;
  })();

  /* ── Overlay: risk filter, or the panel for the flow in progress ── */
  const panel = (title: string, sub: string, body: React.ReactNode) => (
    <div
      className="absolute left-4 bottom-4 z-10 w-[320px] max-w-[calc(100%-5rem)] bg-white rounded-xl shadow-xl border border-gray-100 p-3 flex flex-col gap-2.5 animate-message-in"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={closeFlow}
          aria-label="Back to the risk map"
          className="size-7 -ml-1 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeft size={15} />
        </button>
        <div className="min-w-0">
          <p className="text-sm text-gray-900">{title}</p>
          <p className="text-xs text-gray-500 leading-snug">{sub}</p>
        </div>
      </div>
      {body}
    </div>
  );

  let overlay: React.ReactNode;
  if (site && part && flow?.kind === "contact") {
    const r = resolutions[site.id];
    const { contact } = part.shipment;
    overlay = panel(
      `Contact ${part.shipment.carrier}`,
      `${part.name} ×${part.qty} · caught in the ${part.disruption.title}`,
      r?.kind === "rerouted" || r?.kind === "eta-confirmed" ? (
        <>
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-2.5 flex flex-col gap-1">
            <p className="text-[11px] text-gray-400">Reply from {contact.name}</p>
            <p className="text-xs text-gray-800 leading-snug">
              {r.kind === "rerouted"
                ? `Rerouting now via the ${part.reroute.via}. New ETA to site ${shortDate(part.reroute.eta)}.`
                : `Confirmed - the truck is held behind the closure. Revised ETA to site ${shortDate(part.shipment.revisedEta)}.`}
            </p>
            <div className="self-start mt-1">
              <SlipBadge hours={slip(part, r.kind === "rerouted" ? part.reroute.eta : part.shipment.revisedEta)} />
            </div>
          </div>
          {r.kind === "eta-confirmed" ? (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setRequest("reroute");
                  setMessage(draftMessage(part, "reroute"));
                  setResolutions((x) => {
                    const next = { ...x };
                    delete next[site.id];
                    return next;
                  });
                }}
                variant="outline"
                className="flex-1 rounded-full h-8 text-xs font-bold text-gray-800 cursor-pointer"
              >
                Ask to reroute
              </Button>
              <Button onClick={() => startSupplier(site)} className="flex-1 rounded-full h-8 text-xs font-bold cursor-pointer">
                Try a supplier
              </Button>
            </div>
          ) : (
            <Button onClick={closeFlow} className="rounded-full h-8 text-xs font-bold gap-1.5 cursor-pointer">
              Done
            </Button>
          )}
        </>
      ) : (
        <>
          <p className="text-xs text-gray-600">
            {contact.name}, {contact.role} · {contact.phone}
          </p>
          <div className="flex bg-gray-100 rounded-full p-[3px]">
            {REQUESTS.map((q) => (
              <button
                key={q.id}
                onClick={() => {
                  setRequest(q.id);
                  setMessage(draftMessage(part, q.id));
                }}
                disabled={r?.kind === "awaiting"}
                aria-pressed={request === q.id}
                className={`flex-1 h-7 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  request === q.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
          {request === "reroute" && (
            <p className="text-[11px] text-gray-500">
              Suggested detour via the {part.reroute.via} lands {shortDate(part.reroute.eta)}.
            </p>
          )}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={r?.kind === "awaiting"}
            className="w-full h-24 px-2.5 py-2 text-xs text-gray-800 border border-gray-200 rounded-lg outline-none focus:border-gray-400 resize-none leading-snug disabled:bg-gray-50"
          />
          <Button onClick={sendMessage} disabled={r?.kind === "awaiting" || !message.trim()} className="rounded-full h-8 text-xs font-bold gap-1.5 cursor-pointer">
            {r?.kind === "awaiting" ? (
              <>
Waiting on {part.shipment.carrier}
              </>
            ) : (
              <>
Send to {contact.name.split(" ")[0]}
              </>
            )}
          </Button>
        </>
      )
    );
  } else if (site && part && flow?.kind === "supplier") {
    overlay = panel(
      "Explore alternative supplier",
      `Local stock for ${part.name} ×${part.qty} · needed on site ${shortDate(part.neededBy)}`,
      <>
        <div className="flex flex-col gap-1.5">
          {part.suppliers.map((sup) => {
            const active = chosenSupplier === sup.id;
            return (
              <button
                key={sup.id}
                onClick={() => setChosenSupplier(sup.id)}
                aria-pressed={active}
                className={`text-left rounded-lg border px-2.5 py-2 flex items-center gap-2.5 transition-colors cursor-pointer ${
                  active ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <Store size={15} className="text-gray-700 shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block text-xs text-gray-900 truncate">{sup.name}</span>
                  <span className="block text-[11px] text-gray-400 truncate">
                    {sup.stock} · on site {shortDate(sup.arrives)} · {sup.cost}
                  </span>
                  {sup.recommended && (
                    <span className="block mt-1 text-[10px] text-gray-400 tracking-wider">Recommended by HMAX</span>
                  )}
                </span>
                <SlipBadge hours={slip(part, sup.arrives)} />
              </button>
            );
          })}
        </div>
        <Button onClick={reserveStock} disabled={!chosenSupplier} className="rounded-full h-8 text-xs font-bold gap-1.5 cursor-pointer">
          <span className="truncate">Reserve stock from {part.suppliers.find((x) => x.id === chosenSupplier)?.location ?? "supplier"}</span>
        </Button>
      </>
    );
  } else {
    overlay = (
      <div className="absolute top-14 left-4 right-[224px] z-10 flex flex-wrap items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
        <TabGroup
          value={risk}
          onChange={(v) => {
            setRisk(v);
            setSelectedId(null);
          }}
          options={PM_ALERT_TYPES}
          countFor={(t) => PM_SITES.filter((s) => s.risks.includes(t as PmAlertType)).length}
          label="Risk type"
        />
        {visible.length === 0 && (
          <p className="text-sm text-gray-500 bg-white/90 rounded-full px-4 py-2 shadow">No contracts match this search or filter.</p>
        )}
      </div>
    );
  }

  return (
    <>
      <AttentionDrawer itemId={detail?.kind === "attention" ? detail.id : null} onClose={() => setDetail(null)} />
      <ContractDrawer contractId={detail?.kind === "ops" ? detail.id : null} onClose={() => setDetail(null)} />
      <SlaContractDrawer contractId={detail?.kind === "sla" ? detail.id : null} onClose={() => setDetail(null)} />
      <StaticMap
        pins={pins}
        renderTip={(pin) =>
          pin.truck ? truckTip(pin.truck) : pin.disruption ? disruptionTip(pin.disruption) : pin.supplier ? supplierTip(pin.supplier) : pin.site ? siteTip(pin.site) : null
        }
        renderPin={renderPin}
        layer={routes}
        overlay={overlay}
        selectedId={selectedId}
        onSelect={setSelectedId}
        tipWidth={288}
        tipHeight={flow ? 220 : 380}
        search={flow ? undefined : { value: query, onChange: setQuery, placeholder: "Search contracts" }}
        title="Risk Map"
      />
    </>
  );
}
