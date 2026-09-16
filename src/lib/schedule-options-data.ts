/* Recovery options for the "Adjust Schedule" CTA on a slipping contract. */

export interface ScheduleOption {
  id: string;
  title: string;
  newDate: string;
  impact: string;
  tradeoff: string;
  recommended?: boolean;
}

export const SCHEDULE_OPTIONS: ScheduleOption[] = [
  {
    id: "compress",
    title: "Compress the critical path",
    newDate: "14 Sep - recovers the outage window",
    impact: "Add 2 crews · +€90k",
    tradeoff: "Tight - no float left if anything slips again",
    recommended: true,
  },
  {
    id: "extend",
    title: "Extend the outage window",
    newDate: "28 Sep",
    impact: "Needs grid-operator approval",
    tradeoff: "Out of your control - depends on Xcel and the grid",
  },
  {
    id: "split",
    title: "Split delivery - partial handover",
    newDate: "Phase 1 by 14 Sep, remainder Q1",
    impact: "Defers €0.4m to next quarter",
    tradeoff: "Two mobilisations, higher total cost",
  },
  {
    id: "defer",
    title: "Defer to the February window",
    newDate: "Feb 2027",
    impact: "Misses the €1.2m milestone invoice this quarter",
    tradeoff: "Lowest delivery cost, worst commercially",
  },
];
