/* ── PM team - people & allocation ───────────────────────────────── */

export interface Certification {
  name: string;
  expires: string; // YYYY-MM
}
export interface Person {
  id: string;
  name: string;
  role: string;
  location: string;
  allocation: number;      // % utilisation
  avatar: string;
  /** Contract ids this person is assigned to (see OPS_CONTRACTS). */
  contractIds: string[];
  /** Lead ids this person owns (see OPPORTUNITIES). Sales roles only. */
  leadIds?: string[];
  /** On-site field engineer (does inspections). */
  field?: boolean;
  competencies: string[];
  certifications: Certification[];
}

export const PEOPLE: Person[] = [
  {
    id: "p-daniel",
    name: "Daniel Brooks",
    role: "Senior Field Engineer",
    location: "Chicago, IL",
    allocation: 92,
    avatar: "/avatars/12.jpg",
    contractIds: ["ct-sherco"],
    field: true,
    competencies: ["HV authorised", "Thermography Lvl 2", "HVDC commissioning"],
    certifications: [
      { name: "IEC 62271", expires: "2027-03" },
      { name: "Site safety (SMSTS)", expires: "2026-11" },
    ],
  },
  {
    id: "p-sarah",
    name: "Sarah Mitchell",
    role: "Field Delivery Lead",
    location: "Aberdeen, UK",
    allocation: 96,
    avatar: "/avatars/5.jpg",
    contractIds: ["ct-northsea", "ct-baltic"],
    field: true,
    competencies: ["Lifting supervisor", "Offshore operations"],
    certifications: [
      { name: "BOSIET", expires: "2026-09" },
      { name: "PMP", expires: "2028-01" },
    ],
  },
  {
    id: "p-lena",
    name: "Lena Fischer",
    role: "Field Service Engineer",
    location: "Hamburg, DE",
    allocation: 74,
    avatar: "/avatars/9.jpg",
    contractIds: ["ct-pacific"],
    field: true,
    competencies: ["HV competent", "Oil sampling", "DGA analysis"],
    certifications: [
      { name: "IEC 60599 (DGA)", expires: "2027-06" },
      { name: "Confined space", expires: "2026-12" },
    ],
  },
  {
    id: "p-marcus",
    name: "Marcus Lee",
    role: "Reliability Engineer",
    location: "Columbus, OH",
    allocation: 61,
    avatar: "/avatars/14.jpg",
    contractIds: ["ct-baltic"],
    field: true,
    competencies: ["Vibration analysis (Cat III)", "PD testing", "Power factor"],
    certifications: [
      { name: "ISO 18436-2", expires: "2027-02" },
      { name: "HV switching", expires: "2026-10" },
    ],
  },
  {
    id: "p-priya",
    name: "Priya Nair",
    role: "Commissioning Engineer",
    location: "Manchester, UK",
    allocation: 68,
    avatar: "/avatars/15.jpg",
    contractIds: ["ct-sherco"],
    field: true,
    competencies: ["Commissioning", "Protection & control", "SCADA"],
    certifications: [
      { name: "IEC 61850", expires: "2027-09" },
      { name: "First aid", expires: "2026-09" },
    ],
  },
];

// On-site field engineers - used by the Diagnostics view.
/* ── Sales team ──────────────────────────────────────────────────────
   Account-facing owners. They carry the leads in OPPORTUNITIES and the
   service contracts on those same accounts. */
export const SALES_PEOPLE: Person[] = [
  {
    id: "p-elena",
    name: "Elena Novak",
    role: "Account Director",
    location: "Denver, CO",
    allocation: 88,
    avatar: "/avatars/33.jpg",
    contractIds: ["ct-sherco"],
    leadIds: ["opp-xcel", "opp-nv"],
    competencies: [],
    certifications: [],
  },
  {
    id: "p-tomas",
    name: "Tomás Ruiz",
    role: "Senior Account Manager",
    location: "Chicago, IL",
    allocation: 94,
    avatar: "/avatars/11.jpg",
    contractIds: ["ct-northsea", "ct-baltic"],
    leadIds: ["opp-comed", "opp-duke"],
    competencies: [],
    certifications: [],
  },
  {
    id: "p-hannah",
    name: "Hannah Cole",
    role: "Account Manager",
    location: "Columbus, OH",
    allocation: 71,
    avatar: "/avatars/13.jpg",
    contractIds: ["ct-pacific"],
    leadIds: ["opp-aep", "opp-pacific"],
    competencies: [],
    certifications: [],
  },
];

export const FIELD_ENGINEERS: Person[] = PEOPLE.filter((p) => p.field);

/** Delivery-side team - the people who run contracts, not leads. */
export const DELIVERY_TEAM: Person[] = PEOPLE;

/** Everyone who owns a lead - the sales-facing view of the team. */
export const SALES_TEAM: Person[] = SALES_PEOPLE;

/** Resolve a short owner credit ("Daniel B.") to the person behind it, so
 *  widgets that only carry the short form can still show a face. */
export function personByShortName(short: string): Person | undefined {
  const [first, initial] = short.replace(/\.$/, "").split(" ");
  return [...PEOPLE, ...SALES_PEOPLE].find(
    (p) => p.name.startsWith(`${first} `) && (!initial || p.name.split(" ")[1]?.startsWith(initial))
  );
}
