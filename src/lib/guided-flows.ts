/* ── Data-driven guided flows ────────────────────────────────────────
   Every task in the conversation overlay runs a guided, multi-step wizard.
   Mobilization and lead have bespoke wizards; every other task is
   described here as data and rendered by the generic FlowWizardCard.

   A flow's input steps are shown as tabs, followed by an auto-generated
   "Review" step summarising every field before the final action. */

import type { ContextEntity } from "@/components/dashboard/conversation-launcher";

export type FlowFieldType = "text" | "textarea" | "chips" | "date";

export interface FlowField {
  type: FlowFieldType;
  label: string;
  value?: string;      // pre-filled / default-selected value
  options?: string[];  // chips options
  star?: boolean;      // required marker
  full?: boolean;      // span both grid columns
}

export interface FlowStep {
  label: string;       // tab label
  title: string;
  sub: string;
  fields: FlowField[];
  banner?: { title: string; sub: string };
}

export interface GuidedFlow {
  id: string;
  match: RegExp;       // detects the flow from the user's prompt
  intro: string;       // assistant line shown before the wizard
  cta: string;         // final action button label
  done: string;        // completion message
  /** Follow-up questions offered once the flow finishes. */
  doneSuggestions?: string[];
  /** And the next steps HMAX recommends taking from here. */
  doneActions?: { label: string; prompt: string }[];
  entity?: ContextEntity; // pins a record in the context pane
  steps: FlowStep[];
}

export const GUIDED_FLOWS: GuidedFlow[] = [
  {
    id: "work-order",
    match: /\b(raise|create|open|new|log)\s+(a\s+|an\s+)?(new\s+|corrective\s+|verification\s+)?contract\b/,
    intro: "Let's raise a contract - I'll pre-fill what I can from the asset record.",
    cta: "Raise contract",
    done: "✓ Contract raised and assigned to Daniel Brooks.\n\nIt's scheduled against AST-001 and now appears in the Contracts tab. I'll notify the assignee and reserve the parts.",
    doneSuggestions: ["Show the contract", "What else is scheduled on AST-001?"],
    doneActions: [{ label: "Assign a different engineer", prompt: "Assign a different engineer to the contract" }, { label: "Order the parts", prompt: "Order the parts for the contract now" }],
    entity: { kind: "asset", id: "ast-001" },
    steps: [
      {
        label: "Details",
        title: "Contract details",
        sub: "What needs doing and how urgent it is.",
        fields: [
          { type: "text", label: "Asset", value: "AST-001", star: true },
          { type: "text", label: "Title", value: "Cooling-system diagnostic - hotspot", star: true },
          { type: "chips", label: "Type", options: ["Corrective", "Preventive", "Inspection"], value: "Corrective" },
          { type: "chips", label: "Priority", options: ["Low", "Medium", "High", "Critical"], value: "Critical" },
          { type: "textarea", label: "Description", value: "Investigate Y-phase bushing hotspot flagged on the latest thermal scan; confirm cause and remediate.", full: true },
        ],
      },
      {
        label: "Assignment",
        title: "Assignment & schedule",
        sub: "Who picks it up and when it's due.",
        fields: [
          { type: "text", label: "Assignee", value: "Daniel Brooks", star: true },
          { type: "date", label: "Due date", value: "2026-09-02" },
          { type: "text", label: "Parts required", value: "Cooling fan assembly ×2" },
        ],
      },
    ],
  },
  {
    id: "change-order",
    match: /\b(raise|create|new|open|log)\b.*\bchange order\b/,
    intro: "Let's raise a change order for review - I'll draft it against the contract.",
    cta: "Raise change order",
    done: "✓ Change order CO-242 raised and routed for approval.\n\nIt's linked to the Sherco HVDC contract and blocks progress invoicing until signed. I've flagged the schedule and margin impact for the approver.",
    doneSuggestions: ["Show the change order", "What does this do to the margin?"],
    doneActions: [{ label: "Notify the approver", prompt: "Request approval for change order CO-242" }, { label: "Flag margin impact", prompt: "Flag the margin impact of CO-242 for portfolio review" }],
    entity: { kind: "contract", id: "ct-sherco" },
    steps: [
      {
        label: "Details",
        title: "Change order details",
        sub: "What's changing and why.",
        fields: [
          { type: "text", label: "Contract", value: "Sherco HVDC winding replacement", star: true },
          { type: "chips", label: "Reason", options: ["Scope addition", "Weather standby", "Site access", "Variation"], value: "Scope addition" },
          { type: "text", label: "Value", value: "€320k", star: true },
          { type: "textarea", label: "Description", value: "Additional winding sets beyond the original contract scope; requires technical review before pricing is booked.", full: true },
        ],
      },
      {
        label: "Impact",
        title: "Impact & approval",
        sub: "How it affects the plan and who signs it off.",
        fields: [
          { type: "text", label: "Schedule impact", value: "+3 weeks" },
          { type: "text", label: "Margin impact", value: "-2.4pts" },
          { type: "text", label: "Approver", value: "Sarah Mitchell", star: true },
        ],
      },
    ],
  },
  {
    id: "hse-report",
    match: /\b(log|raise|create|file|report)\b.*\b(hse|health and safety)\b/,
    intro: "Let's log an HSE report - I'll capture the details and route it correctly.",
    cta: "Log HSE report",
    done: "✓ HSE report HSE-0092 logged and acknowledged.\n\nThe site supervisor has been notified and corrective actions are tracked to closure. I've checked whether it's RIDDOR-reportable and flagged accordingly.",
    doneSuggestions: ["Show the HSE report", "Is this RIDDOR-reportable?"],
    doneActions: [{ label: "Assign corrective actions", prompt: "Assign the corrective actions for HSE-0092" }, { label: "Notify the safety lead", prompt: "Request a safety lead review of HSE-0092" }],
    steps: [
      {
        label: "Report",
        title: "Report the event",
        sub: "What happened, where, and how serious.",
        fields: [
          { type: "chips", label: "Type", options: ["Near-miss", "Hazard", "Injury", "Complaint"], value: "Near-miss" },
          { type: "text", label: "Location", value: "North Sea platform cluster", star: true },
          { type: "chips", label: "Severity", options: ["Low", "Medium", "High"], value: "Medium" },
          { type: "textarea", label: "Description", value: "Dropped-load near-miss during the winding lift; no injury. Lifting plan under review.", full: true },
        ],
      },
      {
        label: "Actions",
        title: "Immediate actions",
        sub: "What's been done and who owns follow-up.",
        fields: [
          { type: "textarea", label: "Immediate action taken", value: "Area cordoned, lift halted, toolbox talk re-run before work resumed.", full: true },
          { type: "text", label: "Action owner", value: "Liam O'Neill", star: true },
          { type: "chips", label: "RIDDOR reportable", options: ["Yes", "No", "Under review"], value: "Under review" },
        ],
      },
    ],
  },
  {
    id: "invoice",
    match: /\b(create|draft|raise|generate|issue)\b.*\binvoice\b/,
    intro: "Let's draft an invoice - I'll pull the milestone and contract details.",
    cta: "Create invoice",
    done: "✓ Invoice INV-3310 drafted for €1.2m.\n\nIt's tied to the milestone on the Sherco HVDC contract and ready for review before sending to Xcel Energy.",
    doneSuggestions: ["Preview the invoice", "Which milestones does this cover?"],
    doneActions: [{ label: "Send for approval", prompt: "Request approval to send invoice INV-3310" }, { label: "Adjust payment terms", prompt: "Adjust the payment terms on invoice INV-3310" }],
    entity: { kind: "contract", id: "ct-sherco" },
    steps: [
      {
        label: "Details",
        title: "Invoice details",
        sub: "Who it's for and what it covers.",
        fields: [
          { type: "text", label: "Customer", value: "Xcel Energy", star: true },
          { type: "text", label: "Contract", value: "Sherco HVDC winding replacement" },
          { type: "text", label: "Milestone", value: "Engineering approval", star: true },
          { type: "text", label: "Amount", value: "€1.2m", star: true },
        ],
      },
      {
        label: "Terms",
        title: "Payment terms",
        sub: "When and how it's paid.",
        fields: [
          { type: "chips", label: "Payment terms", options: ["Net 30", "Net 60", "Milestone-based"], value: "Net 30" },
          { type: "date", label: "Due date", value: "2026-09-30" },
          { type: "text", label: "PO number", value: "PO-XCEL-4471" },
        ],
      },
    ],
  },
  {
    id: "impact-report",
    match: /\b(create|generate|draft|build)\b.*\bimpact report\b/,
    intro: "Let's build an impact report - tell me the focus and audience and I'll assemble it.",
    cta: "Generate impact report",
    done: "✓ Impact report generated.\n\nIt covers reliability and financial impact for the period, with the charts and headline metrics ready to export or share.",
    doneSuggestions: ["Preview the report", "What period does it cover?"],
    doneActions: [{ label: "Draft a covering note", prompt: "Draft a covering note for the impact report" }, { label: "Add to my report", prompt: "Add the impact report to my weekly report" }],
    steps: [
      {
        label: "Scope",
        title: "Report scope",
        sub: "What the report should cover.",
        fields: [
          { type: "text", label: "Subject", value: "Xcel Energy portfolio", star: true },
          { type: "chips", label: "Period", options: ["Last month", "Last quarter", "Year to date"], value: "Last quarter" },
          { type: "chips", label: "Focus", options: ["Reliability", "Financial", "Delivery", "Safety"], value: "Reliability" },
        ],
      },
      {
        label: "Format",
        title: "Format & audience",
        sub: "How it should read and who it's for.",
        fields: [
          { type: "chips", label: "Audience", options: ["Executive", "Customer", "Internal"], value: "Customer" },
          { type: "chips", label: "Include charts", options: ["Yes", "No"], value: "Yes" },
          { type: "textarea", label: "Notes", value: "Highlight the avoided-failure story on AST-001 and the on-time delivery trend.", full: true },
        ],
      },
    ],
  },
  {
    id: "renewal-quote",
    match: /\b(draft|create|prepare|build|generate)\b.*\brenewal\b/,
    intro: "Let's draft a renewal quote - I'll base it on the current agreement.",
    cta: "Draft renewal quote",
    done: "✓ Renewal quote drafted.\n\nIt carries a 3% uplift over a 5-year term and is ready to review before it goes to the customer.",
    doneSuggestions: ["Preview the quote", "How does the uplift compare to last renewal?"],
    doneActions: [{ label: "Adjust the uplift", prompt: "Adjust the uplift on the renewal quote" }, { label: "Send for approval", prompt: "Request approval for the renewal quote" }],
    steps: [
      {
        label: "Agreement",
        title: "Current agreement",
        sub: "What we're renewing.",
        fields: [
          { type: "text", label: "Customer", value: "ComEd", star: true },
          { type: "text", label: "Current SLA", value: "5-year Service Agreement" },
          { type: "date", label: "Expiry", value: "2026-12-31" },
          { type: "text", label: "Annual value", value: "€1.8m" },
        ],
      },
      {
        label: "Terms",
        title: "Renewal terms",
        sub: "Pricing and any scope changes.",
        fields: [
          { type: "chips", label: "Uplift", options: ["0%", "3%", "5%", "Custom"], value: "3%" },
          { type: "chips", label: "Duration", options: ["3 years", "5 years"], value: "5 years" },
          { type: "textarea", label: "Scope changes", value: "Add condition monitoring for two additional converter units.", full: true },
        ],
      },
    ],
  },
  {
    id: "inspection-plan",
    match: /\b(create|draft|build|schedule)\b.*\binspection plan\b/,
    intro: "Let's create an inspection plan - I'll suggest an interval from the asset's condition.",
    cta: "Create inspection plan",
    done: "✓ Inspection plan created.\n\nQuarterly thermal and DGA checks are scheduled against AST-001 with an engineer assigned to the first window.",
    doneSuggestions: ["Show the plan", "What does the first window cover?"],
    doneActions: [{ label: "Assign an engineer", prompt: "Assign an engineer to the first inspection window" }, { label: "Add to the calendar", prompt: "Add the inspection plan to the maintenance calendar" }],
    entity: { kind: "asset", id: "ast-001" },
    steps: [
      {
        label: "Scope",
        title: "Inspection scope",
        sub: "What to inspect and how often.",
        fields: [
          { type: "text", label: "Asset", value: "AST-001", star: true },
          { type: "chips", label: "Inspection type", options: ["Visual", "Thermal", "DGA", "PD survey"], value: "Thermal" },
          { type: "chips", label: "Interval", options: ["Monthly", "Quarterly", "Annual"], value: "Quarterly" },
        ],
      },
      {
        label: "Resourcing",
        title: "Resourcing & access",
        sub: "Who does it and what's needed on site.",
        fields: [
          { type: "text", label: "Engineer", value: "Lena Fischer", star: true },
          { type: "date", label: "First window", value: "2026-09-15" },
          { type: "textarea", label: "Access requirements", value: "Outage window required; coordinate with station operations for isolation.", full: true },
        ],
      },
    ],
  },
  {
    id: "feasibility-review",
    match: /\b(draft|create|do|run|submit|start)\b.*\bfeasibility\b/,
    intro: "Let's work through a feasibility review - I'll pull the scope handed over from sales.",
    cta: "Submit feasibility review",
    done: "✓ Feasibility review submitted.\n\nThe verdict and rationale are recorded against the Sherco HVDC scope and shared back with the sales owner.",
    doneSuggestions: ["Show the review", "What constraints did it find?"],
    doneActions: [{ label: "Flag the constraint", prompt: "Flag the design constraint on the handover" }, { label: "Notify the sales owner", prompt: "Request the sales owner reviews the feasibility outcome" }],
    entity: { kind: "contract", id: "ct-sherco" },
    steps: [
      {
        label: "Scope",
        title: "Scope under review",
        sub: "What's being assessed.",
        fields: [
          { type: "text", label: "Contract", value: "Sherco HVDC winding replacement", star: true },
          { type: "textarea", label: "Scope summary", value: "Replace converter-transformer windings within the autumn outage window.", full: true },
          { type: "chips", label: "Primary constraint", options: ["Design", "Site", "Standards", "Schedule"], value: "Schedule" },
        ],
      },
      {
        label: "Assessment",
        title: "Assessment",
        sub: "Your verdict and the reasoning.",
        fields: [
          { type: "chips", label: "Verdict", options: ["Feasible", "At risk", "Not feasible"], value: "At risk" },
          { type: "textarea", label: "Rationale", value: "Achievable only if material delivery holds; a further slip pushes the work outside the outage window.", full: true },
          { type: "text", label: "Reviewer", value: "Priya Nair", star: true },
        ],
      },
    ],
  },
  {
    id: "dispatch-engineer",
    match: /\b(schedule|dispatch|assign|send|book)\b.*\b(field engineer|engineer)\b/,
    intro: "Let's dispatch a field engineer - I'll check who's available for the window.",
    cta: "Dispatch engineer",
    done: "✓ Field engineer dispatched.\n\nMarcus Lee is assigned to AST-001 for the requested window and has been sent the task brief and access details.",
    doneSuggestions: ["Show the assignment", "Who else could cover this visit?"],
    doneActions: [{ label: "Send the site brief", prompt: "Request the site brief is sent to the engineer" }, { label: "Reassign the visit", prompt: "Reassign the visit to a different engineer" }],
    entity: { kind: "asset", id: "ast-001" },
    steps: [
      {
        label: "Task",
        title: "Task & priority",
        sub: "Where they're going and how urgent it is.",
        fields: [
          { type: "text", label: "Asset", value: "AST-001", star: true },
          { type: "text", label: "Task", value: "On-site thermal follow-up", star: true },
          { type: "chips", label: "Priority", options: ["Low", "Medium", "High", "Critical"], value: "High" },
        ],
      },
      {
        label: "Engineer",
        title: "Engineer & window",
        sub: "Who's assigned and when.",
        fields: [
          { type: "chips", label: "Engineer", options: ["Daniel Brooks", "Lena Fischer", "Marcus Lee", "Priya Nair"], value: "Marcus Lee" },
          { type: "date", label: "Date", value: "2026-09-04" },
          { type: "textarea", label: "Notes", value: "Bring the thermal camera; coordinate access with Pump Station 1.", full: true },
        ],
      },
    ],
  },
  {
    id: "diagnostics-summary",
    match: /\b(create|draft|build|generate)\b.*\bdiagnostic/,
    intro: "Let's create a diagnostics summary - I'll gather the reports for the asset.",
    cta: "Create summary",
    done: "✓ Diagnostics summary created.\n\nIt consolidates the DGA and thermal findings for AST-001 with a recommended next step, ready to attach to the asset record.",
    doneSuggestions: ["Preview the summary", "What does the trend point to?"],
    doneActions: [{ label: "Raise a corrective contract", prompt: "Raise a corrective contract from the diagnostics summary" }, { label: "Attach to the asset", prompt: "Add the diagnostics summary to the asset record" }],
    entity: { kind: "asset", id: "ast-001" },
    steps: [
      {
        label: "Scope",
        title: "Summary scope",
        sub: "Which asset and which reports.",
        fields: [
          { type: "text", label: "Asset", value: "AST-001", star: true },
          { type: "chips", label: "Reports", options: ["DGA", "Thermal", "Vibration", "PD"], value: "Thermal" },
          { type: "chips", label: "Period", options: ["Last month", "Last quarter", "Year to date"], value: "Last quarter" },
        ],
      },
      {
        label: "Output",
        title: "Output & audience",
        sub: "What the summary should include.",
        fields: [
          { type: "chips", label: "Include recommendation", options: ["Yes", "No"], value: "Yes" },
          { type: "chips", label: "Audience", options: ["Reliability", "Customer", "Internal"], value: "Reliability" },
          { type: "textarea", label: "Notes", value: "Correlate the Y-phase hotspot with the elevated hydrogen trend before recommending action.", full: true },
        ],
      },
    ],
  },
  {
    id: "draft-message",
    match: /\b(draft|write|send|chase|escalate|notify)\b.*\b(message|email|note|chase|customer|legal|engineering|reliability|qa|supplier|approver|safety|owner|team)\b/,
    intro: "Let's draft that message - I've pulled the context so you can review and edit before it goes.",
    cta: "Send message",
    done: "✓ Message drafted and ready to send.\n\nI've attached the relevant record so the recipient has the full context. Review it, then send - or schedule a reminder to follow up if you don't hear back.",
    doneSuggestions: ["Edit the message", "Who else should see this?"],
    doneActions: [{ label: "Send the message", prompt: "Request approval to send the message" }, { label: "Schedule a reminder", prompt: "Schedule a follow-up reminder" }],
    steps: [
      {
        label: "Recipient",
        title: "Who's it for?",
        sub: "Confirm who you're chasing and how urgent it is.",
        fields: [
          { type: "text", label: "To", value: "", star: true },
          { type: "chips", label: "Priority", options: ["Normal", "High", "Urgent"], value: "High" },
          { type: "chips", label: "Channel", options: ["Email", "Teams", "Both"], value: "Email" },
        ],
      },
      {
        label: "Message",
        title: "What do you want to say?",
        sub: "I've drafted a starting point from the context - edit as needed.",
        fields: [
          { type: "text", label: "Subject", value: "Action needed", star: true },
          { type: "textarea", label: "Message", value: "Hi - flagging this needs your attention. Could you confirm status and expected turnaround? The relevant details are attached. Thanks.", full: true },
        ],
      },
    ],
  },
];

export function flowFor(prompt: string): GuidedFlow | undefined {
  const q = prompt.toLowerCase();
  return GUIDED_FLOWS.find((f) => f.match.test(q));
}

export function flowById(id?: string): GuidedFlow | undefined {
  return id ? GUIDED_FLOWS.find((f) => f.id === id) : undefined;
}
