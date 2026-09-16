/* ── Alert playbooks ─────────────────────────────────────────────────
   When a user clicks the primary CTA on an alert (contracts / assets /
   accounts / leads), the conversation opens with a grounded,
   useful response instead of a canned answer:
     · the situation (the alert's own data),
     · a specific recommendation to act on,
     · next-step buttons that kick off a guided wizard where possible.

   The situation is passed in from the alert's detail (already grounded);
   the recommendation + steps are keyed off the primary action label. */

import { PEOPLE } from "@/lib/people-data";
import { ALT_VENDORS } from "@/lib/vendors-data";
import { SCHEDULE_OPTIONS } from "@/lib/schedule-options-data";
import { CHANGE_ORDERS } from "@/lib/change-orders-data";
import { ASSET_DETAILS } from "@/lib/sales-data";
import type { ViewDoc } from "@/components/dashboard/sales/document-viewer";

export interface PlaybookStep {
  label: string;
  prompt: string; // sent as a new message - many trigger a guided wizard
}

/* A pickable option (crew member, vendor, schedule option). */
export interface PanelOption {
  id: string;
  title: string;
  subtitle?: string;
  avatar?: string;
  meta: { label: string; value: string }[];
  tags?: string[];
  chooseLabel: string;
  choosePrompt: string; // sent when picked - usually starts a wizard
  recommended?: boolean;
}

/* A fill-in field for the "complete the missing info" form. */
export interface PanelField {
  label: string;
  owner: string;     // who to reach out to
  done: boolean;
  placeholder?: string;
}

export type PlaybookPanel =
  | { kind: "options"; heading: string; note?: string; options: PanelOption[] }
  | { kind: "recap"; heading: string; rows: { label: string; value: string }[]; note?: string; doc?: ViewDoc }
  | { kind: "form"; heading: string; note?: string; fields: PanelField[]; submitLabel: string; submitPrompt: string }
  | { kind: "draft"; heading: string; note?: string; value: string; submitLabel: string; submitPrompt: string };

export interface Playbook {
  situation: string;
  recommendation: string;
  steps: PlaybookStep[];
  panel?: PlaybookPanel;
}

export interface PlaybookContext {
  coCode?: string;                              // for "Review change order"
  missing?: { label: string; owner: string }[]; // for "Complete scope of work"
  assetId?: string;                             // for "Review asset health"
  title?: string;                               // the alert's title, for review docs
  ref?: string;                                 // an explicit document reference
  // For "Review feasibility" (scope reviews):
  verdict?: "feasible" | "at-risk" | "not-feasible" | "pending";
  scope?: string;
  value?: string;
  from?: string;
}

interface Recipe {
  recommendation: string;
  steps: PlaybookStep[];
}

const RECIPES: Record<string, Recipe> = {
  /* ── Operations: contracts needing attention ── */
  "adjust schedule": {
    recommendation:
      "Recover the slip before committing to a new date: resequence the critical path and confirm whether the outage window can flex. If it can't, model the revised delivery date and its milestone-invoice impact, then take that to the customer with the reasoning.",
    steps: [
      { label: "Model the impact", prompt: "Create an impact report on the delivery slip" },
      { label: "Escalate to the customer", prompt: "Draft a message escalating the delivery risk to the customer" },
    ],
  },
  "reassign vendor": {
    recommendation:
      "Treat this as a concentration risk, not six separate delays. Qualify at least one alternative supplier, model the switching cost and schedule impact, then start moving new work off the single vendor.",
    steps: [
      { label: "Request alternative quotes", prompt: "Draft a message requesting quotes from alternative suppliers" },
      { label: "Assess the switch impact", prompt: "Create an impact report on switching vendors" },
    ],
  },
  "review change order": {
    recommendation:
      "Review the technical impact and price, then raise it for signature - progress invoicing stays blocked and margin sits under baseline until it's booked.",
    steps: [
      { label: "Raise the change order", prompt: "Raise a change order for this contract" },
      { label: "Estimate the margin impact", prompt: "Create an impact report on the change order" },
    ],
  },
  "document scope": {
    recommendation:
      "Get the verbal agreement on paper before any more work is done - an undocumented extension is unbilled scope creep. I've drafted the scope from the site notes; review it and log it as a change order.",
    steps: [],
  },
  "review ncr": {
    recommendation:
      "Disposition the non-conformance before work continues - accept-with-justification, rework, or reject. Raise a corrective contract so the fix is tracked to closure.",
    steps: [
      { label: "Raise a corrective contract", prompt: "Raise a corrective contract for the non-conformance" },
      { label: "Notify QA", prompt: "Draft a message to QA on the NCR disposition" },
    ],
  },
  "review hse report": {
    recommendation:
      "Confirm the corrective actions are closed out and check whether it's RIDDOR-reportable. Log the follow-up so it's tracked, and make sure the crew has been re-briefed.",
    steps: [
      { label: "Log the HSE follow-up", prompt: "Log an HSE report for the corrective actions" },
      { label: "Notify the safety lead", prompt: "Draft a message notifying the safety lead" },
    ],
  },
  "rebalance crew": {
    recommendation:
      "The crew is over capacity for the added scope. Move the task to a certified engineer with free capacity, or bring in additional resource before the schedule slips.",
    steps: [
      { label: "Reassign to an available engineer", prompt: "Schedule a field engineer for this work" },
      { label: "Who has capacity?", prompt: "Who has spare capacity and the right certifications for this work?" },
    ],
  },
  "schedule cert renewal": {
    recommendation:
      "The lapsing certificates block remobilisation. Schedule the renewal now, or line up a certified alternate so the visit isn't delayed.",
    steps: [
      { label: "Schedule the renewal", prompt: "Create an inspection plan for the certificate renewal" },
      { label: "Find a certified alternate", prompt: "Which engineers hold the required offshore certifications?" },
    ],
  },
  "request written access": {
    recommendation:
      "A verbal arrangement won't hold - get written site access before mobilising, and issue it as a change order so it's contractually tracked.",
    steps: [
      { label: "Raise the access change order", prompt: "Raise a change order for the written site-access agreement" },
      { label: "Draft the access request", prompt: "Draft a message requesting written site access from the customer" },
    ],
  },

  /* ── Assets: sales alerts ── */
  "schedule inspection": {
    recommendation:
      "Health is degrading - get eyes on it before load rises into the peak. Schedule an inspection in the next window and assign a certified engineer.",
    steps: [
      { label: "Create an inspection plan", prompt: "Create an inspection plan for this asset" },
      { label: "Dispatch an engineer", prompt: "Schedule a field engineer for the inspection" },
    ],
  },
  "create contract": {
    recommendation:
      "Convert the finding into tracked work: raise a corrective contract, assign it to a competent engineer, and reserve the parts it needs.",
    steps: [
      { label: "Raise a contract", prompt: "Raise a new contract for this asset" },
      { label: "Dispatch an engineer", prompt: "Schedule a field engineer for this asset" },
    ],
  },
  "order parts": {
    recommendation:
      "Reserve the parts the repair needs and check lead times before you commit to a work date - a long-lead item can push the whole job.",
    steps: [{ label: "Raise a contract", prompt: "Raise a new contract for this asset" }],
  },
  "assign technician": {
    recommendation:
      "Match the task to a certified, available engineer and dispatch them for the next window so it doesn't sit unassigned.",
    steps: [{ label: "Dispatch a field engineer", prompt: "Schedule a field engineer for this asset" }],
  },

  /* ── Assets & scope: reliability ── */
  "review feasibility": {
    recommendation:
      "Check the proposed scope against the asset's real condition and site constraints before you sign it off. If it's borderline, record the risk; if it can't be done as written, hand it back to sales with the reason.",
    steps: [
      { label: "Submit a feasibility review", prompt: "Submit a feasibility review for this scope" },
      { label: "Check site constraints", prompt: "What site constraints affect this handover?" },
    ],
  },
  "review drawings": {
    recommendation:
      "Confirm the latest drawing revision matches the as-built before any work is planned. Flag any discrepancy to engineering so it's corrected at source.",
    steps: [
      { label: "Raise a verification contract", prompt: "Raise a contract to verify the drawing against as-built" },
      { label: "Note it to engineering", prompt: "Draft a message to engineering about the drawing discrepancy" },
    ],
  },
  "review site constraints": {
    recommendation:
      "Compare the handover assumptions with actual site conditions. Where they conflict the scope can't proceed as written - record it and route it back before mobilisation.",
    steps: [
      { label: "Submit a feasibility review", prompt: "Submit a feasibility review flagging the site constraint" },
      { label: "Flag the conflict", prompt: "Draft a message flagging the site-constraint conflict to the owner" },
    ],
  },
  "review standard": {
    recommendation:
      "Check whether the new standard or bulletin changes the accepted scope or method. If it does, update the assessment before sign-off so the work stays compliant.",
    steps: [{ label: "Submit a feasibility review", prompt: "Submit a feasibility review against the updated standard" }],
  },
  "confirm scope": {
    recommendation: "The scope looks feasible - confirm it and record your sign-off so sales can proceed with the offer.",
    steps: [{ label: "Submit the feasibility review", prompt: "Submit a feasibility review confirming the scope" }],
  },
  "return to sales": {
    recommendation:
      "The scope can't be delivered as written. Hand it back with the specific blocker and what would make it feasible, so it isn't just bounced.",
    steps: [
      { label: "Submit the review", prompt: "Submit a feasibility review marking the scope not feasible" },
      { label: "Draft the handback note", prompt: "Draft a message returning the scope to sales with the reason" },
    ],
  },

  /* ── Assets: diagnostics ── */
  "review dga trend": {
    recommendation:
      "Read the gas ratios against the trend, not a single sample. If the pattern points to a fault, capture the interpretation and raise corrective work; if it's stable, keep it on monitoring.",
    steps: [
      { label: "Create a diagnostics summary", prompt: "Create a diagnostics summary for this asset" },
      { label: "Raise a corrective contract", prompt: "Raise a corrective contract for the fault" },
    ],
  },
  "review electrical tests": {
    recommendation:
      "Compare the electrical results against nameplate limits and the prior tests. Confirm the fault signature before you record an interpretation.",
    steps: [
      { label: "Create a diagnostics summary", prompt: "Create a diagnostics summary for this asset" },
      { label: "Raise a corrective contract", prompt: "Raise a corrective contract for this asset" },
    ],
  },
  "review inspection report": {
    recommendation:
      "Check the field inspection against the sensor data - where the technician's view and the data disagree, verify before you act. Then log the interpretation.",
    steps: [
      { label: "Create a diagnostics summary", prompt: "Create a diagnostics summary for this asset" },
      { label: "Schedule a follow-up visit", prompt: "Schedule a field engineer for a follow-up inspection" },
    ],
  },

  /* ── Accounts & leads ── */
  "complete scope of work": {
    recommendation:
      "The Scope of Work is the blocker to reaching Offer, and it's owned by Engineering. Chase it with a clear deadline and the asset list so they can turn it around.",
    steps: [{ label: "Chase Engineering", prompt: "Draft a message to Engineering to complete the scope of work" }],
  },
  "review asset health": {
    recommendation:
      "The declining unit is what makes this account worth a proactive call. Lead with the condition trend and a reliability recommendation, not a sales pitch.",
    steps: [
      { label: "Build an impact report", prompt: "Create an impact report on the asset health" },
      { label: "Draft the customer note", prompt: "Draft a message to the customer about the asset health" },
    ],
  },
  "request install base profile": {
    recommendation:
      "Without the Install Base profile the lead can't reach Offer. Request it from Reliability with the asset list so they can turn it around quickly.",
    steps: [{ label: "Request from Reliability", prompt: "Draft a message to Reliability requesting the Install Base profile" }],
  },
  "capture install base profile": {
    recommendation:
      "Capture the Install Base profile to move this forward - pull it from the asset records where you can, or request the gaps from Reliability.",
    steps: [{ label: "Request the gaps", prompt: "Draft a message to Reliability for the Install Base profile" }],
  },
  "finalize legal t&cs": {
    recommendation:
      "Legal T&Cs are the last input before the offer can go out. Chase Legal with the deal terms so they can finalise, then release the offer.",
    steps: [{ label: "Chase Legal", prompt: "Draft a message to Legal to finalise the T&Cs" }],
  },
  "send offer": {
    recommendation:
      "Every input is in place - the offer is ready. Draft the cover note and route it for approval before it goes to the customer.",
    steps: [{ label: "Draft the cover note", prompt: "Draft a message sending the offer to the customer" }],
  },
  "qualify budget & scope": {
    recommendation:
      "Early stage - qualify the customer's budget and confirm the scope is real before investing effort. Capture what you learn against the lead.",
    steps: [{ label: "Draft qualification questions", prompt: "Draft a message to the customer to qualify budget and scope" }],
  },
};

const DEFAULT: Recipe = {
  recommendation:
    "Here's what the data shows. Decide whether to act now or keep it on watch - I can turn any of this into a tracked task or a message in a couple of clicks.",
  steps: [
    { label: "Raise a contract", prompt: "Raise a new contract" },
    { label: "Draft a message", prompt: "Draft a message about this" },
  ],
};

/* ── Interactive panels for the richer CTAs ──────────────────────── */

// Rebalance crew - eligible people, most spare capacity first.
function crewPanel(): PlaybookPanel {
  const eligible = [...PEOPLE].sort((a, b) => a.allocation - b.allocation).slice(0, 4);
  return {
    kind: "options",
    heading: "Who can take it on",
    note: "Ranked by spare capacity. Certifications and competencies shown so you can match the scope.",
    options: eligible.map((p, i) => ({
      id: p.id,
      title: p.name,
      subtitle: `${p.role} · ${p.location}`,
      avatar: p.avatar,
      meta: [
        { label: "Allocation", value: `${p.allocation}%` },
        { label: "Spare", value: `${Math.max(0, 100 - p.allocation)}%` },
      ],
      tags: p.competencies.slice(0, 3),
      chooseLabel: `Assign ${p.name.split(" ")[0]}`,
      choosePrompt: `Schedule ${p.name} as the field engineer to take on the over-allocated scope`,
      recommended: i === 0,
    })),
  };
}

// Reassign vendor - approved alternatives to the concentrated supplier.
function vendorPanel(): PlaybookPanel {
  return {
    kind: "options",
    heading: "Approved alternative suppliers",
    note: "Qualified vendors that can take the winding-set supply off the single-vendor dependency.",
    options: ALT_VENDORS.map((v) => ({
      id: v.id,
      title: v.name,
      subtitle: v.note,
      meta: [
        { label: "Lead time", value: v.leadTime },
        { label: "Cost", value: v.costDelta },
        { label: "Capacity", value: v.capacity },
      ],
      tags: [v.rating],
      chooseLabel: `Switch to ${v.name.split(" ")[0]}`,
      choosePrompt: `Raise a change order to switch the winding-set supply to ${v.name}`,
      recommended: v.recommended,
    })),
  };
}

// Adjust schedule - recovery options with their impact.
function schedulePanel(): PlaybookPanel {
  return {
    kind: "options",
    heading: "Recovery options",
    note: "Each with its delivery date and the trade-off it carries.",
    options: SCHEDULE_OPTIONS.map((o) => ({
      id: o.id,
      title: o.title,
      subtitle: o.tradeoff,
      meta: [
        { label: "New date", value: o.newDate },
        { label: "Impact", value: o.impact },
      ],
      chooseLabel: "Choose this",
      choosePrompt: `Draft a message proposing to ${o.title.toLowerCase()} to the customer`,
      recommended: o.recommended,
    })),
  };
}

// Split a "€320k" / "€1.2m" value into a proportional line item.
function splitGBP(value: string, fraction: number): string {
  const m = value.match(/([\d.]+)\s*([km])?/i);
  if (!m) return value;
  const num = parseFloat(m[1]) * fraction;
  const unit = (m[2] ?? "").toLowerCase();
  const rounded = unit === "m" ? Math.round(num * 100) / 100 : Math.round(num);
  return `€${rounded}${unit}`;
}

// Review change order - recap the CO and link the document.
function changeOrderPanel(coCode?: string): PlaybookPanel | undefined {
  const co = coCode ? CHANGE_ORDERS[coCode] : undefined;
  if (!co) return undefined;
  const doc: ViewDoc = {
    kind: "contract",
    docType: "Change order",
    title: `${co.code} · ${co.scope}`,
    ref: co.code,
    preview: "text",
    fields: [
      { label: "Contract", value: co.contract },
      { label: "Value", value: co.value },
      { label: "Reason", value: co.reason },
      { label: "Status", value: co.status },
      { label: "Raised", value: co.raised },
      { label: "Requested by", value: co.requestedBy },
    ],
    sections: [
      { heading: "Scope", text: co.scope },
      {
        heading: "Cost breakdown",
        table: {
          columns: ["Line item", "Amount"],
          rows: [
            ["Materials & equipment", splitGBP(co.value, 0.72)],
            ["Labour & commissioning", splitGBP(co.value, 0.22)],
            ["Contingency", splitGBP(co.value, 0.06)],
            ["Total", co.value],
          ],
        },
      },
      { heading: "Schedule impact", text: co.scheduleImpact },
      { heading: "Margin impact", text: co.marginImpact },
    ],
  };
  return {
    kind: "recap",
    heading: `${co.code} - ${co.status}`,
    rows: [
      { label: "Scope", value: co.scope },
      { label: "Value", value: co.value },
      { label: "Schedule impact", value: co.scheduleImpact },
      { label: "Margin impact", value: co.marginImpact },
      { label: "Requested by", value: `${co.requestedBy} · ${co.raised}` },
    ],
    note: co.status === "Awaiting signature" ? "Progress invoicing stays blocked until this is signed." : undefined,
    doc,
  };
}

// Complete scope of work - what's missing, who owns it, fill it in.
function scopeFormPanel(missing?: { label: string; owner: string }[]): PlaybookPanel {
  const items = missing && missing.length > 0
    ? missing
    : [{ label: "Scope of Work & tech requirements", owner: "Engineering - J. Park" }];
  return {
    kind: "form",
    heading: "Missing offer inputs",
    note: "Fill in what you have, or reach out to the owner for the rest.",
    fields: items.map((m) => ({ label: m.label, owner: m.owner, done: false, placeholder: `Add ${m.label.toLowerCase()}…` })),
    submitLabel: "Request from owners",
    submitPrompt: "Draft a message to the owners to complete the missing offer inputs",
  };
}

// Review asset health - summarise the asset's relevant condition data.
function healthPanel(assetId?: string): PlaybookPanel {
  const d = ASSET_DETAILS[assetId ?? "ast-001"] ?? ASSET_DETAILS["ast-001"];
  const readingRows = d.readings.slice(0, 4).map((r) => ({
    label: r.label,
    value: `${r.value}${r.state === "alert" ? " · alert" : r.state === "watch" ? " · watch" : ""}`,
  }));
  const hp = d.stats.healthPct;
  const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const trend = [hp + 34, hp + 26, hp + 18, hp + 12, hp + 6, hp].map((v, i) => ({ label: months[i], value: Math.max(0, Math.min(100, v)) }));
  const doc: ViewDoc = {
    kind: "report",
    docType: "Asset health report",
    title: `${d.code} - condition & health`,
    ref: d.code,
    preview: "text",
    fields: [
      { label: "Type", value: d.type },
      { label: "Status", value: d.stats.status },
      { label: "Health", value: `${d.stats.healthPct}%` },
      { label: "Last service", value: d.stats.lastService },
    ],
    sections: [
      { heading: "Health index trend", chart: { unit: "%", threshold: 60, points: trend } },
      {
        heading: "Condition readings",
        table: {
          columns: ["Parameter", "Reading", "State"],
          rows: d.readings.map((r) => [r.label, r.value, r.state === "alert" ? "Alert" : r.state === "watch" ? "Watch" : "Normal"]),
        },
      },
      { heading: "Summary", text: d.contextSummary },
    ],
  };
  return {
    kind: "recap",
    heading: `${d.code} - ${d.stats.status} · health ${d.stats.healthPct}%`,
    rows: [
      { label: "Type", value: d.type },
      { label: "Commissioned", value: d.stats.commissioned },
      { label: "Last service", value: d.stats.lastService },
      ...readingRows,
    ],
    note: d.contextSummary,
    doc,
  };
}

// Generic "Review …" - summarise + link the reviewed document.
const REVIEW_DOCTYPE: Record<string, string> = {
  "review ncr": "Non-conformance report",
  "review hse report": "HSE report",
  "review dga trend": "DGA report",
  "review electrical tests": "Electrical test report",
  "review inspection report": "Field inspection report",
  "review feasibility": "Scope feasibility",
  "review drawings": "Design drawing",
  "review site constraints": "Site survey",
  "review standard": "Engineering bulletin",
};

// The actual document content - with data tables, trend charts and photos.
function reviewDoc(key: string, docType: string, ref: string, title: string, situation: string, assetId?: string): ViewDoc {
  const asset = assetId ? assetId.toUpperCase() : "-";
  const base = { kind: "report" as const, docType, title, ref, preview: "text" as const };

  if (key === "review dga trend") {
    return {
      ...base,
      fields: [
        { label: "Asset", value: asset },
        { label: "Sample date", value: "2026-08-26" },
        { label: "Lab", value: "Relcare · Chennai" },
        { label: "Status", value: "Awaiting interpretation" },
      ],
      sections: [
        {
          heading: "Dissolved gas analysis",
          table: {
            columns: ["Gas", "Result (ppm)", "Caution", "Status"],
            rows: [
              ["Hydrogen (H₂)", "480", "100", "Alert"],
              ["Acetylene (C₂H₂)", "6", "1", "Alert"],
              ["Ethylene (C₂H₄)", "54", "50", "Watch"],
              ["Methane (CH₄)", "118", "120", "Normal"],
              ["Ethane (C₂H₆)", "33", "65", "Normal"],
              ["Carbon monoxide (CO)", "420", "350", "Watch"],
            ],
          },
        },
        { heading: "Hydrogen trend", chart: { unit: "ppm", threshold: 100, points: [{ label: "Mar", value: 180 }, { label: "Apr", value: 240 }, { label: "May", value: 300 }, { label: "Jun", value: 360 }, { label: "Jul", value: 420 }, { label: "Aug", value: 480 }] } },
        { heading: "Interpretation", text: situation + " Rising hydrogen with trace acetylene points to a developing thermal fault with possible low-energy arcing, corroborating the Y-phase bushing hotspot." },
      ],
    };
  }

  if (key === "review electrical tests") {
    return {
      ...base,
      fields: [
        { label: "Asset", value: asset },
        { label: "Test date", value: "2026-08-22" },
        { label: "Standard", value: "IEEE C57.152" },
        { label: "Status", value: "Awaiting review" },
      ],
      sections: [
        {
          heading: "Test results",
          table: {
            columns: ["Test", "Result", "Limit", "Verdict"],
            rows: [
              ["Insulation resistance", "1.2 GΩ", "≥1 GΩ", "Pass"],
              ["Polarization index", "1.4", "≥2.0", "Fail"],
              ["Winding resistance (Y)", "0.82 Ω", "0.78 ±5%", "Watch"],
              ["Power factor / tan δ", "0.9%", "≤0.5%", "Fail"],
              ["Turns ratio dev.", "0.3%", "≤0.5%", "Pass"],
            ],
          },
        },
        { heading: "Interpretation", text: situation + " Low polarization index and elevated power factor indicate insulation ageing/moisture; recommend a follow-up and trend against the next test." },
      ],
    };
  }

  if (key === "review inspection report") {
    return {
      ...base,
      fields: [
        { label: "Asset", value: asset },
        { label: "Engineer", value: "Lena Fischer" },
        { label: "Date", value: "2026-08-19" },
        { label: "Type", value: "Visual + thermal" },
      ],
      sections: [
        {
          heading: "Findings",
          table: {
            columns: ["Item", "Observation", "Severity"],
            rows: [
              ["Cooling manifold", "Surface corrosion, gasket seepage", "High"],
              ["Y-phase bushing", "Discolouration near flange", "Watch"],
              ["Tap-changer", "No visible defect", "Normal"],
            ],
          },
        },
        { heading: "Notes", text: situation },
      ],
      images: [{ caption: "Cooling manifold - corrosion" }, { caption: "Y-phase bushing flange" }, { caption: "Thermal - hotspot" }],
    };
  }

  if (key === "review ncr") {
    return {
      ...base,
      fields: [
        { label: "Reference", value: ref },
        { label: "Raised by", value: "QA · Radiography" },
        { label: "Date", value: "2026-08-23" },
        { label: "Disposition", value: "Open" },
      ],
      sections: [
        {
          heading: "Measurements",
          table: {
            columns: ["Check", "Spec", "Actual", "Result"],
            rows: [
              ["Weld porosity (set 2)", "≤2% area", "3.4%", "Fail"],
              ["Radiographic density", "2.0–4.0", "4.3", "Fail"],
              ["Surface finish", "Ra ≤3.2", "Ra 2.8", "Pass"],
            ],
          },
        },
        { heading: "Disposition", text: situation + " Recommend rework of winding set 2 and re-radiography before assembly continues." },
      ],
    };
  }

  if (key === "review hse report") {
    return {
      ...base,
      fields: [
        { label: "Type", value: "Near-miss" },
        { label: "Location", value: "North Sea platform" },
        { label: "Severity", value: "Medium" },
        { label: "RIDDOR", value: "Under review" },
      ],
      sections: [
        {
          heading: "Corrective actions",
          table: {
            columns: ["Action", "Owner", "Status"],
            rows: [
              ["Re-run lifting plan & toolbox talk", "Liam O.", "Closed"],
              ["RIDDOR reportability check", "HSE", "In progress"],
              ["Re-induct crew on dropped-load", "Site lead", "Open"],
            ],
          },
        },
        { heading: "Summary", text: situation },
      ],
    };
  }

  // feasibility / drawings / site constraints / standard - text summary.
  return {
    ...base,
    kind: key === "review drawings" ? "drawing" : "report",
    preview: key === "review drawings" ? "drawing" : "text",
    fields: [
      { label: "Reference", value: ref },
      { label: "Status", value: "Awaiting your review" },
    ],
    sections: [{ heading: "Summary", text: situation }],
  };
}

/* ── Review feasibility - summarise the scope + a sign-off call ──── */
const VERDICT_LABEL: Record<NonNullable<PlaybookContext["verdict"]>, string> = {
  feasible: "Feasible",
  "at-risk": "At risk",
  "not-feasible": "Not feasible",
  pending: "Awaiting review",
};

function feasibilityAssessment(v: NonNullable<PlaybookContext["verdict"]>): string {
  switch (v) {
    case "feasible": return "Checked against the asset's nameplate ratings and site constraints - the scope is deliverable as written with no exceptions.";
    case "at-risk": return "Deliverable, but only if the flagged condition holds. The margin against the asset's ratings is thin, so there's execution risk if anything moves.";
    case "not-feasible": return "As written, the scope exceeds the asset's ratings or conflicts with the site constraints. It can't be delivered without a change to the scope.";
    case "pending": return "Not yet assessed against the asset record and site survey - key technical points are still open.";
  }
}

export function feasibilityRecommendation(v: NonNullable<PlaybookContext["verdict"]>): string {
  switch (v) {
    case "feasible": return "Looks good to sign off. Approve it and record your sign-off so sales can proceed to offer.";
    case "at-risk": return "Sign off only conditionally - record the risk and the mitigation (e.g. the cooling upgrade) so it isn't a silent assumption. If the mitigation can't be committed, hand it back.";
    case "not-feasible": return "Don't sign off as written. Return it to sales with the specific blocker and what would make it feasible.";
    case "pending": return "Not enough here to sign off yet. Verify the open points against the nameplate and site survey, then record a verdict.";
  }
}

function feasibilityPanel(ctx: PlaybookContext, situation: string): PlaybookPanel {
  const v = ctx.verdict!;
  const label = VERDICT_LABEL[v];
  const rows = [
    { label: "Scope", value: ctx.scope ?? "-" },
    { label: "Value", value: ctx.value ?? "-" },
    { label: "Handover from", value: ctx.from ?? "-" },
    { label: "Verdict", value: label },
  ];
  const doc: ViewDoc = {
    kind: "contract",
    docType: "Scope feasibility",
    title: ctx.title ?? "Scope feasibility review",
    ref: ctx.ref ?? "Scope review",
    preview: "text",
    fields: rows,
    sections: [
      { heading: "Scope summary", text: situation },
      { heading: "Feasibility assessment", text: feasibilityAssessment(v) },
      { heading: "Sign-off recommendation", text: feasibilityRecommendation(v) },
    ],
  };
  return { kind: "recap", heading: `Scope feasibility - ${label}`, rows, doc };
}

function reviewRecapPanel(action: string, situation: string, ctx?: PlaybookContext): PlaybookPanel {
  const key = action.trim().toLowerCase();
  const docType = REVIEW_DOCTYPE[key] ?? "Document";
  const codeRe = /\b(?:NCR|CO|FR|DWG|FAT|DGA)-[A-Za-z0-9-]+/;
  const ref =
    ctx?.ref ||
    ctx?.title?.match(codeRe)?.[0] ||
    situation.match(codeRe)?.[0] ||
    (ctx?.assetId ? ctx.assetId.toUpperCase() : "-");
  const doc = reviewDoc(key, docType, ref, ctx?.title ?? docType, situation, ctx?.assetId);
  return {
    kind: "recap",
    heading: `${docType}${ref !== "-" ? ` · ${ref}` : ""}`,
    rows: [
      { label: "Document", value: docType },
      { label: "Reference", value: ref },
      { label: "Status", value: "Awaiting your review" },
    ],
    doc,
  };
}

// Finalize legal T&Cs - summarise the document and link to it.
function legalPanel(): PlaybookPanel {
  const doc: ViewDoc = {
    kind: "contract",
    docType: "Legal terms & conditions",
    title: "Service agreement - terms & conditions",
    ref: "T&C-v4.2",
    preview: "text",
    fields: [
      { label: "Owner", value: "Legal - R. Bianchi" },
      { label: "Status", value: "Outstanding - final review" },
      { label: "Version", value: "v4.2 (redline)" },
      { label: "Blocking", value: "Offer release" },
    ],
    sections: [
      { heading: "Liability cap", text: "Capped at 100% of annual contract value; carve-outs for gross negligence remain under review." },
      { heading: "Payment terms", text: "Net 30 from milestone acceptance; late-payment interest at 1.5%/month." },
      { heading: "Warranty", text: "24-month workmanship warranty on replaced components." },
      { heading: "Termination", text: "For convenience with 90 days' notice; pro-rata fees on work in progress." },
    ],
  };
  return {
    kind: "recap",
    heading: "Terms & conditions - v4.2 · Outstanding",
    rows: [
      { label: "Owner", value: "Legal - R. Bianchi" },
      { label: "Open point", value: "Liability-cap carve-outs" },
      { label: "Liability cap", value: "100% of annual value" },
      { label: "Payment terms", value: "Net 30 from acceptance" },
      { label: "Blocking", value: "Offer release" },
    ],
    note: "The only open point is the liability-cap carve-out. Everything else is agreed.",
    doc,
  };
}

// Document scope - recommend a scope, editable before it's logged.
function scopeDraftPanel(): PlaybookPanel {
  return {
    kind: "draft",
    heading: "Recommended scope",
    note: "Drafted from the on-site agreement and prior change orders. Edit before you log it as a change order.",
    value:
      "Additional protection-relay works agreed verbally on site: supply and install 3× protection-relay modules on the North Sea platform cluster, including commissioning and updated protection settings. Estimated value €680k. To be raised as a change order for signature before invoicing.",
    submitLabel: "Log as a change order",
    submitPrompt: "Raise a change order documenting the additional protection-relay scope",
  };
}

// Schedule cert renewal - options to keep the visit on track.
function certRenewalPanel(): PlaybookPanel {
  return {
    kind: "options",
    heading: "How to keep the visit on track",
    note: "Two offshore certificates lapse before the next window - each option below keeps remobilisation unblocked.",
    options: [
      {
        id: "fast-track",
        title: "Fast-track refresher before the visit",
        subtitle: "Keeps the existing crew on the job",
        meta: [{ label: "Complete by", value: "10 Sep" }, { label: "Effort", value: "2-day course" }],
        chooseLabel: "Schedule renewal",
        choosePrompt: "Create an inspection plan for the offshore certificate renewal before the next visit",
        recommended: true,
      },
      {
        id: "alternate",
        title: "Swap in a certified alternate",
        subtitle: "Use an engineer whose certs are current",
        meta: [{ label: "Available", value: "Immediate" }, { label: "Impact", value: "No delay" }],
        chooseLabel: "Assign alternate",
        choosePrompt: "Schedule a certified alternate field engineer for the offshore visit",
      },
      {
        id: "book-course",
        title: "Book the next standard course",
        subtitle: "Lowest cost, but misses the window",
        meta: [{ label: "Next slot", value: "22 Sep" }, { label: "Impact", value: "Delays the visit" }],
        chooseLabel: "Book course",
        choosePrompt: "Draft a message to book the offshore certification course for the crew",
      },
    ],
  };
}

function panelFor(action: string, situation: string, ctx?: PlaybookContext): PlaybookPanel | undefined {
  // Scope reviews (review feasibility / confirm scope / return to sales) carry
  // a verdict - summarise the scope and give a sign-off call.
  if (ctx?.verdict) return feasibilityPanel(ctx, situation);
  switch (action.trim().toLowerCase()) {
    case "rebalance crew":
      return crewPanel();
    case "reassign vendor":
      return vendorPanel();
    case "adjust schedule":
      return schedulePanel();
    case "review change order":
      return changeOrderPanel(ctx?.coCode);
    case "complete scope of work":
      return scopeFormPanel(ctx?.missing);
    case "review asset health":
      return healthPanel(ctx?.assetId);
    case "finalize legal t&cs":
      return legalPanel();
    case "document scope":
      return scopeDraftPanel();
    case "schedule cert renewal":
      return certRenewalPanel();
    default:
      // Any other "Review …" action: summarise + link the document.
      if (action.trim().toLowerCase().startsWith("review")) return reviewRecapPanel(action, situation, ctx);
      return undefined;
  }
}

export function buildPlaybook(action: string, situation: string, ctx?: PlaybookContext): Playbook {
  const r = RECIPES[action.trim().toLowerCase()] ?? DEFAULT;
  const panel = panelFor(action, situation, ctx);
  // When an options/form panel drives the interaction, the generic text
  // steps are redundant; the recap panel keeps its steps (e.g. "Raise it").
  const steps = panel && (panel.kind === "options" || panel.kind === "form" || panel.kind === "draft") ? [] : r.steps;
  // A scope review's recommendation is the sign-off call for its verdict.
  const recommendation = ctx?.verdict ? feasibilityRecommendation(ctx.verdict) : r.recommendation;
  return { situation, recommendation, steps, panel };
}
