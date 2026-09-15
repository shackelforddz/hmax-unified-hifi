/* ── Role-aware recommended conversations/tasks ──────────────────────
   Shown in the conversations pane when a user has no history yet, so the
   first thing they see is a set of useful things to ask or get done. */

export interface RecommendedTask {
  label: string;  // short display text
  prompt: string; // the message sent to the assistant
}

export const RECOMMENDED_TASKS: Record<string, RecommendedTask[]> = {
  "Project Manager": [
    { label: "Summarise contracts needing my attention", prompt: "Summarise the contracts that need my attention and why." },
    { label: "Which projects are slipping delivery?", prompt: "Which projects are slipping their delivery date, and by how much?" },
    { label: "Where is vendor concentration a risk?", prompt: "Where is vendor concentration a risk across my portfolio?" },
    { label: "Who on my team is over-allocated?", prompt: "Who on my team is over-allocated right now?" },
  ],
  Sales: [
    { label: "What's my weighted pipeline forecast?", prompt: "What is my weighted pipeline forecast this quarter?" },
    { label: "Which SLA renewals are coming up?", prompt: "Which SLA renewals are coming up and which are at risk?" },
    { label: "Summarise leads at offer stage", prompt: "Summarise my leads at offer stage or beyond." },
    { label: "Which accounts have asset alerts?", prompt: "Which accounts have open asset alerts I should know about?" },
  ],
  Operations: [
    { label: "Which contracts are behind and why?", prompt: "Which contracts are behind schedule and what's driving it?" },
    { label: "Summarise open change orders", prompt: "Summarise the open change orders I need to review." },
    { label: "Where are HSE or quality issues open?", prompt: "Where do I have open HSE complaints or quality non-conformances?" },
    { label: "How is portfolio margin tracking?", prompt: "How is portfolio margin tracking versus plan?" },
  ],
  "Reliability Engineer": [
    { label: "Which assets need review first?", prompt: "Which assets need my review first, by priority?" },
    { label: "Summarise contracts to review", prompt: "Summarise the contracts handed to me for feasibility review." },
    { label: "What site constraints affect handover?", prompt: "What site constraints affect the current handovers?" },
    { label: "Which assets are trending to failure?", prompt: "Which assets are trending toward failure based on condition data?" },
  ],
  Diagnostics: [
    { label: "Which field reports need interpretation?", prompt: "Which field reports are waiting on my interpretation?" },
    { label: "Summarise assets with a fault signature", prompt: "Summarise the assets currently showing a fault signature." },
    { label: "Prioritise DGA reports to review", prompt: "Prioritise the DGA reports awaiting my review." },
    { label: "What's my field-report turnaround?", prompt: "What is my field-report turnaround and where's the bottleneck?" },
  ],
};

export function recommendedTasksFor(role: string): RecommendedTask[] {
  return RECOMMENDED_TASKS[role] ?? RECOMMENDED_TASKS["Project Manager"];
}

/* Action-oriented tasks - things to create/do, not just ask. Some (mobilization
   plan, new lead) hook into the assistant's guided wizards. */
export const RECOMMENDED_ACTIONS: Record<string, RecommendedTask[]> = {
  "Project Manager": [
    { label: "Create a mobilization plan", prompt: "Create a mobilization plan for Xcel Energy" },
    { label: "Raise a new contract", prompt: "Raise a new contract" },
    { label: "Create an impact report", prompt: "Create an impact report" },
    { label: "Create an invoice", prompt: "Create an invoice" },
  ],
  Sales: [
    { label: "Create a new lead", prompt: "Create a new lead" },
    { label: "Create a mobilization plan", prompt: "Create a mobilization plan for Xcel Energy" },
    { label: "Draft a renewal quote", prompt: "Draft a renewal quote" },
    { label: "Create an impact report", prompt: "Create an impact report" },
  ],
  Operations: [
    { label: "Create a mobilization plan", prompt: "Create a mobilization plan for Xcel Energy" },
    { label: "Raise a change order", prompt: "Raise a change order" },
    { label: "Log an HSE report", prompt: "Log an HSE report" },
    { label: "Create an impact report", prompt: "Create an impact report" },
  ],
  "Reliability Engineer": [
    { label: "Create an inspection plan", prompt: "Create an inspection plan" },
    { label: "Raise a new contract", prompt: "Raise a new contract" },
    { label: "Draft a feasibility review", prompt: "Draft a feasibility review" },
    { label: "Create an impact report", prompt: "Create an impact report" },
  ],
  Diagnostics: [
    { label: "Raise a corrective contract", prompt: "Raise a corrective contract" },
    { label: "Schedule a field engineer", prompt: "Schedule a field engineer" },
    { label: "Create a diagnostics summary", prompt: "Create a diagnostics summary" },
    { label: "Create an impact report", prompt: "Create an impact report" },
  ],
};

export function recommendedActionsFor(role: string): RecommendedTask[] {
  return RECOMMENDED_ACTIONS[role] ?? RECOMMENDED_ACTIONS["Project Manager"];
}
