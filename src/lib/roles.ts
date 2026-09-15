export interface Role {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export const RECOMMENDED_ROLE: Role = {
  id: "project-manager",
  label: "Project Manager",
  description:
    "Optimized for tracking deliverables, managing team capacity, monitoring project health, and mitigating program-level risks. Pre-configured with modular widgets for instant status reporting.",
  icon: "Briefcase",
};

export const ALTERNATIVE_ROLES: Role[] = [
  {
    id: "sales",
    label: "Sales",
    description:
      "Customer pipelines, lead tracking, revenue forecasts, and account management dashboards.",
    icon: "Banknote",
  },
  {
    id: "operations",
    label: "Operations",
    description:
      "Resource utilization, workforce scheduling, operational KPIs, and service delivery tracking.",
    icon: "RefreshCcw",
  },
  {
    id: "reliability-engineer",
    label: "Reliability Engineer",
    description:
      "System health monitoring, incident tracking, SLA compliance, and predictive maintenance alerts.",
    icon: "Cog",
  },
  {
    id: "diagnostics",
    label: "Diagnostics",
    description:
      "Field-report interpretation, fault-signature detection, and coordinating field engineers for asset inspections.",
    icon: "Stethoscope",
  },
];

export const ALL_ROLES: Role[] = [RECOMMENDED_ROLE, ...ALTERNATIVE_ROLES];

/* ── Per-role demo login URLs ────────────────────────────────────── */
// Slug → role label. Canonical slugs are the role ids; aliases are accepted.
export const ROLE_SLUGS: Record<string, string> = {
  "project-manager": "Project Manager",
  pm: "Project Manager",
  sales: "Sales",
  operations: "Operations",
  ops: "Operations",
  "reliability-engineer": "Reliability Engineer",
  reliability: "Reliability Engineer",
  diagnostics: "Diagnostics",
};

export function roleFromSlug(slug: string): Role | undefined {
  const label = ROLE_SLUGS[slug.toLowerCase()];
  return label ? ALL_ROLES.find((r) => r.label === label) : undefined;
}

// Roles with a dedicated dashboard view - the ones worth demoing.
export const DEMO_ROLES: Role[] = ALL_ROLES.filter((r) =>
  ["project-manager", "sales", "operations", "reliability-engineer", "diagnostics"].includes(r.id)
);

/* ── Role-confirm intro content ──────────────────────────────────── */
export const PRODUCT_INTRO =
  "HMAX Unified brings your assets, contracts and teams into one place - with a conversational assistant that helps you deep dive and get your work done.";

export interface HowToStep {
  icon: string;   // lucide icon name
  title: string;
  detail: string;
}

// A short "how to use the product" primer shown on the final login step.
export const HOW_TO_USE: HowToStep[] = [
  {
    icon: "LayoutDashboard",
    title: "Start from your dashboard",
    detail:
      "Your workspace opens on the widgets tuned to your role - the KPIs, alerts and lists that matter to you first.",
  },
  {
    icon: "MessageSquareText",
    title: "Deep dive with the assistant",
    detail:
      "Ask the assistant to dig into a contract, asset or alert. It pulls the data together, explains what's going on and answers your follow-ups.",
  },
  {
    icon: "CircleCheck",
    title: "Get your tasks done",
    detail:
      "Hand off the work - reschedule delivery, draft a review, chase an invoice. The assistant carries the full context and drives it to a next step.",
  },
  {
    icon: "PanelRightOpen",
    title: "Drill into the detail when you need it",
    detail:
      "Open any asset, contract, customer or lead for the full record - summary, documents and history - right alongside the conversation.",
  },
];

export interface RoleIntro {
  detection: string;    // how the role was identified
  highlights: string[]; // what data the workspace surfaces
}

export const ROLE_INTRO: Record<string, RoleIntro> = {
  "Project Manager": {
    detection:
      "Matched from your Hitachi Identity profile in the PMO Division, your project-delivery access groups, and recent activity across contract and milestone tools.",
    highlights: [
      "Customers and contracts needing your attention",
      "Delivery trend, revenue-at-risk and upcoming milestones",
      "Vendor concentration and program-level risk",
      "Your team's allocation and assigned contracts",
    ],
  },
  Sales: {
    detection:
      "Matched from your commercial access groups, account ownership in the pipeline tools, and recent CRM activity.",
    highlights: [
      "Lead pipeline, weighted forecast and stage breakdown",
      "SLA renewals and service-agreement health",
      "Fleet map and asset alerts by account",
      "Repeat-repair assets and account summaries",
    ],
  },
  Operations: {
    detection:
      "Matched from your service-delivery access groups and recent activity across scheduling and work-order systems.",
    highlights: [
      "Portfolio health - margin, revenue and outstanding payments",
      "Contracts needing attention with change-order, HSE and quality alerts",
      "Financial performance and resource capacity",
      "Your team's allocation and contracts",
    ],
  },
  "Reliability Engineer": {
    detection:
      "Matched from your engineering access groups, asset-management activity, and reliability tooling.",
    highlights: [
      "Fleet health and asset alerts by review type",
      "Contracts to review - scope feasibility handed over from sales",
      "Handover-vs-site constraints and engineering bulletins",
      "Nameplate, design drawings and service history per asset",
    ],
  },
  Diagnostics: {
    detection:
      "Matched from your diagnostics access groups and recent field-report interpretation activity.",
    highlights: [
      "Reports awaiting interpretation and field-report turnaround",
      "Asset reports to review - DGA, electrical and physical",
      "Assets showing a fault signature",
      "Your field engineers and their assignments",
    ],
  },
};

export const MOCK_USER = {
  name: "James",
  fullName: "James Jenkins",
  email: "james.jenkins@hitachi-systems.com",
  detectedDivision: "PMO Division",
  avatar: "/avatars/11.jpg",
};
