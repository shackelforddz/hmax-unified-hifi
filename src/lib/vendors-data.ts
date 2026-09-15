/* Alternative suppliers for the "Reassign Vendor" CTA - the Delta Coils
   concentration on HVDC winding sets. */

export interface AltVendor {
  id: string;
  name: string;
  scope: string;
  leadTime: string;
  costDelta: string;
  capacity: string;
  rating: string;
  note: string;
  recommended?: boolean;
}

export const ALT_VENDORS: AltVendor[] = [
  {
    id: "v-nordic",
    name: "Nordic Windings AS",
    scope: "HVDC converter-transformer winding sets",
    leadTime: "9 weeks",
    costDelta: "+4%",
    capacity: "Available now",
    rating: "Approved · Tier 1",
    note: "Fastest available slot; qualified on comparable HVDC units in 2025.",
    recommended: true,
  },
  {
    id: "v-abb",
    name: "ABB Components",
    scope: "HVDC & HVAC winding sets",
    leadTime: "12 weeks",
    costDelta: "+1%",
    capacity: "Q4 slot",
    rating: "Approved · Tier 1",
    note: "Best price, but the slot lands after the outage window.",
  },
  {
    id: "v-hitachi",
    name: "Hitachi Energy - Chennai",
    scope: "Winding sets (internal supply)",
    leadTime: "14 weeks",
    costDelta: "-3%",
    capacity: "Limited",
    rating: "Internal",
    note: "Lowest cost and keeps it in-house; longest lead time.",
  },
];
