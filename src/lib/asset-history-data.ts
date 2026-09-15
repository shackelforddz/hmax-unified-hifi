/* ── Asset service history (who did what, when) ──────────────────── */

export type ServiceEventType = "Inspection" | "Test" | "Repair" | "Service";

export interface ServiceEvent {
  date: string;      // ISO date
  by: string;        // engineer
  role: string;
  action: string;
  type: ServiceEventType;
}

export const ASSET_SERVICE_HISTORY: Record<string, ServiceEvent[]> = {
  "ast-001": [
    { date: "2026-06-12", by: "Daniel Brooks", role: "Senior Field Engineer", action: "Thermal scan - hotspot flagged on Y-phase bushing", type: "Inspection" },
    { date: "2026-04-02", by: "Lena Fischer", role: "Field Service Engineer", action: "Oil sample taken for DGA analysis", type: "Test" },
    { date: "2025-11-18", by: "Marcus Lee", role: "Reliability Engineer", action: "Bushing replacement completed", type: "Repair" },
    { date: "2025-06-05", by: "Priya Nair", role: "Commissioning Engineer", action: "Annual condition assessment & commissioning check", type: "Service" },
  ],
  "ast-002": [
    { date: "2026-08-14", by: "Sarah Mitchell", role: "Delivery Lead", action: "Motor vibration check - bearing signature logged", type: "Inspection" },
    { date: "2026-01-18", by: "Lena Fischer", role: "Field Service Engineer", action: "Seal replacement completed", type: "Repair" },
    { date: "2025-11-02", by: "Marcus Lee", role: "Reliability Engineer", action: "Bearing inspection & lubrication", type: "Service" },
  ],
  "ast-003": [
    { date: "2026-07-05", by: "Lena Fischer", role: "Field Service Engineer", action: "Cooling-fan service - 1 of 4 replaced", type: "Repair" },
    { date: "2026-05-20", by: "Priya Nair", role: "Commissioning Engineer", action: "Oil sample taken for DGA analysis", type: "Test" },
    { date: "2025-12-10", by: "Daniel Brooks", role: "Senior Field Engineer", action: "Visual inspection - cooling manifold seepage noted", type: "Inspection" },
  ],
  "ast-004": [
    { date: "2026-06-22", by: "Marcus Lee", role: "Reliability Engineer", action: "Tap-changer service & contact resistance test", type: "Test" },
    { date: "2026-03-30", by: "Daniel Brooks", role: "Senior Field Engineer", action: "Contact resistance test - within limits", type: "Test" },
    { date: "2025-09-15", by: "Priya Nair", role: "Commissioning Engineer", action: "PD survey of tap-changer compartment", type: "Inspection" },
  ],
};
