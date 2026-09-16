import { SLA_CONTRACTS } from "@/lib/sales-data";
import { OPS_CONTRACTS } from "@/lib/operations-data";

/** A contract detail drawer to open: a delivery contract or a service agreement. */
export type ContractRef = { kind: "ops"; id: string } | { kind: "sla"; id: string };

const norm = (s: string) =>
  s.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/** Resolve a contract name as other records spell it ("ComEd - 5-year Service
 *  Agreement", "Protection relay upgrade") to the drawer that details it.
 *  Falls back to the customer's contract when the name isn't an exact match. */
export function resolveContract(name: string, customer?: string): ContractRef | null {
  const n = norm(name);
  const ops = OPS_CONTRACTS.find((c) => norm(c.name) === n || norm(`${c.customer} - ${c.name}`) === n);
  if (ops) return { kind: "ops", id: ops.id };
  const sla = Object.entries(SLA_CONTRACTS).find(([, s]) => norm(s.agreement) === n);
  if (sla) return { kind: "sla", id: sla[0] };

  // Names often lead with the customer ("Xcel Energy - …").
  const who = norm(customer ?? name.split(" - ")[0]);
  const byAccount = Object.entries(SLA_CONTRACTS).find(([, s]) => norm(s.account) === who);
  if (byAccount) return { kind: "sla", id: byAccount[0] };
  const opsByCustomer = OPS_CONTRACTS.find((c) => norm(c.customer) === who);
  if (opsByCustomer) return { kind: "ops", id: opsByCustomer.id };
  return null;
}
