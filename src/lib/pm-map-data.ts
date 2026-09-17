import { ATTENTION_ITEMS, PM_ALERT_TYPES, type AttentionStatus, type PmAlertType } from "@/lib/dashboard-data";

/* ── PM delivery map ─────────────────────────────────────────────────
   One pin per contract site the PM is delivering, carrying the risk types
   raised against it. Sites waiting on a part carry its shipment - which is
   caught in a traffic disruption - the detour the carrier could take, and
   local suppliers that could cover it instead. */

export type Point = [number, number];

/** How the late part is moving today. */
export interface Shipment {
  carrier: string;
  mode: string;
  contact: { name: string; role: string; phone: string };
  /** Where the truck is now (percent coordinates). */
  x: number;
  y: number;
  /** Its planned route to site, truck first. */
  route: Point[];
  /** ETA before the disruption (ISO, site-local). */
  plannedEta: string;
  /** ETA now it's caught in the disruption (ISO, site-local). */
  revisedEta: string;
}

/** What is holding the shipment up. */
export interface Disruption {
  title: string;
  detail: string;
  x: number;
  y: number;
}

/** The detour the carrier could take if asked. */
export interface Reroute {
  via: string;
  route: Point[];
  eta: string;
}

/** Somewhere with the part in stock locally. */
export interface AltSupplier {
  id: string;
  name: string;
  location: string;
  x: number;
  y: number;
  route: Point[];
  stock: string;
  arrives: string;
  cost: string;
  note: string;
  recommended?: boolean;
}

export interface LatePart {
  name: string;
  qty: number;
  code: string;
  supplier: string;
  /** When the work needs it on site (ISO, site-local). */
  neededBy: string;
  shipment: Shipment;
  disruption: Disruption;
  reroute: Reroute;
  suppliers: AltSupplier[];
}

export interface PmSite {
  id: string;
  customer: string;
  contract: string;
  meta: string;
  status: AttentionStatus;
  risks: PmAlertType[];
  /** The headline flag for each risk type raised on the site. */
  flags: { type: PmAlertType; title: string }[];
  x: number;
  y: number;
  latePart?: LatePart;
}

const HOUR = 3_600_000;
/** Whole hours from `a` to `b` (negative when `b` is earlier). */
export const hoursBetween = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / HOUR);
/** "14 Sep, 13:00" - arrival times are site-local and stored without an offset. */
export const shortDate = (iso: string) =>
  new Date(`${iso}Z`).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
/** "5 hrs", "1 hr". */
export const hoursLabel = (h: number) => `${Math.abs(h)} ${Math.abs(h) === 1 ? "hr" : "hrs"}`;

const PLACES: Record<string, { contract: string; x: number; y: number }> = {
  "xcel-energy": { contract: "Sherco HVDC winding replacement", x: 47, y: 44 },
  siemens: { contract: "North Sea switchgear refurbishment", x: 71, y: 28 },
  "baltic-wind-nl": { contract: "Baltic array transformer maintenance", x: 24, y: 62 },
  "pacific-gas": { contract: "Protection relay upgrade", x: 63, y: 76 },
  comed: { contract: "ComEd 5-year service agreement", x: 33, y: 30 },
  "aep-ohio": { contract: "AEP Ohio converter replacement", x: 80, y: 55 },
};

const LATE_PARTS: Record<string, LatePart> = {
  "xcel-energy": {
    name: "Converter winding set",
    qty: 2,
    code: "ERP-6610",
    supplier: "Delta Coils Inc.",
    neededBy: "2026-09-14T08:00",
    shipment: {
      carrier: "Bertschi",
      mode: "Road freight",
      contact: { name: "Marco Ferri", role: "Dispatch lead", phone: "+39 02 5512 0480" },
      x: 80,
      y: 88,
      route: [[80, 88], [72, 80], [64, 70], [58, 60], [52, 52], [47, 44]],
      plannedEta: "2026-09-14T07:00",
      revisedEta: "2026-09-14T13:00",
    },
    disruption: {
      title: "A1 northbound closure near Lodi",
      detail: "Multi-vehicle collision - lanes closed with a 30 km queue. The truck is held behind the closure and misses its early unloading slot.",
      x: 64,
      y: 70,
    },
    reroute: {
      via: "A21 and the Tangenziale Ovest",
      route: [[80, 88], [88, 74], [80, 60], [66, 52], [56, 48], [47, 44]],
      eta: "2026-09-14T06:00",
    },
    suppliers: [
      {
        id: "hitachi-milan",
        name: "Hitachi Energy Milan warehouse",
        location: "Pero, Milan",
        x: 14,
        y: 22,
        route: [[14, 22], [24, 26], [32, 34], [40, 40], [47, 44]],
        stock: "2 in stock",
        arrives: "2026-09-13T15:00",
        cost: "Internal transfer",
        note: "Same winding spec, unallocated. Released the day it's reserved.",
        recommended: true,
      },
      {
        id: "delta-verona",
        name: "Delta Coils EU depot",
        location: "Verona",
        x: 88,
        y: 12,
        route: [[88, 12], [76, 18], [66, 26], [56, 34], [47, 44]],
        stock: "1 in stock (needs 2)",
        arrives: "2026-09-14T10:00",
        cost: "+€2.4k",
        note: "Covers one set now; the second still rides on the delayed truck.",
      },
    ],
  },
  "aep-ohio": {
    name: "Tap-changer contact set",
    qty: 1,
    code: "ERP-3374",
    supplier: "MR Reinhausen",
    neededBy: "2026-09-25T09:00",
    shipment: {
      carrier: "GLS",
      mode: "Road freight",
      contact: { name: "Elena Russo", role: "Customer service", phone: "+39 02 8950 1122" },
      x: 92,
      y: 26,
      route: [[92, 26], [90, 38], [84, 46], [80, 55]],
      plannedEta: "2026-09-25T07:00",
      revisedEta: "2026-09-25T15:00",
    },
    disruption: {
      title: "Tangenziale Est roadworks",
      detail: "Overnight closure extended through the week - freight diverted onto local roads with long queues.",
      x: 90,
      y: 38,
    },
    reroute: {
      via: "SP103 Cassanese",
      route: [[92, 26], [97, 40], [90, 58], [80, 55]],
      eta: "2026-09-25T08:00",
    },
    suppliers: [
      {
        id: "mr-linate",
        name: "MR Reinhausen Italia stock",
        location: "Linate",
        x: 70,
        y: 92,
        route: [[70, 92], [74, 80], [78, 68], [80, 55]],
        stock: "3 in stock",
        arrives: "2026-09-24T14:00",
        cost: "+€650",
        note: "Local distributor stock, courier to site next day.",
        recommended: true,
      },
      {
        id: "hitachi-monza",
        name: "Hitachi Energy service centre",
        location: "Monza",
        x: 60,
        y: 8,
        route: [[60, 8], [68, 20], [74, 36], [80, 55]],
        stock: "1 in stock",
        arrives: "2026-09-25T11:00",
        cost: "Internal transfer",
        note: "Held for another contract; needs the stores manager to release it.",
      },
    ],
  },
};

export const PM_SITES: PmSite[] = ATTENTION_ITEMS.filter((item) => PLACES[item.id]).map((item) => {
  const place = PLACES[item.id];
  const latePart = LATE_PARTS[item.id];
  const flags = (item.flags ?? []).map((f) => ({ type: f.alertType, title: f.title }));
  if (latePart && !flags.some((f) => f.type === "Spare parts")) {
    flags.push({ type: "Spare parts", title: `${latePart.name} will land ${hoursLabel(hoursBetween(latePart.neededBy, latePart.shipment.revisedEta))} late` });
  }
  return {
    id: item.id,
    customer: item.customer,
    contract: place.contract,
    meta: item.meta,
    status: item.status,
    risks: PM_ALERT_TYPES.filter((t) => flags.some((f) => f.type === t)),
    flags,
    x: place.x,
    y: place.y,
    latePart,
  };
});
