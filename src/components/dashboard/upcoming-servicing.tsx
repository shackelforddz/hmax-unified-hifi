"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { UPCOMING_SERVICING } from "@/lib/dashboard-data";
import { Button } from "@/components/ui/button";
import ContractDrawer from "./operations/contract-drawer";
import WidgetChat from "./widget-chat";

const TITLE = "Upcoming servicing";

export default function UpcomingServicing() {
  const [contractId, setContractId] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      <ContractDrawer contractId={contractId} onClose={() => setContractId(null)} />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-base text-gray-900">{TITLE}</h3>
        <WidgetChat title={TITLE} />
      </div>

      {/* List */}
      <div className="flex flex-col">
        {UPCOMING_SERVICING.map((s, i) => (
          <div
            key={`${s.customer}-${s.task}`}
            className={`flex items-center gap-3 py-3 ${i < UPCOMING_SERVICING.length - 1 ? "border-b border-gray-100" : ""}`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">{s.task}</p>
              <p className="text-xs text-gray-500 truncate">
                {s.customer} • {s.owner}
              </p>
            </div>
            <span className="flex items-center gap-1 text-xs text-gray-500 shrink-0 whitespace-nowrap">
              <Clock size={12} strokeWidth={1.5} />
              {s.dueDays}d
            </span>
            {/* Open the contract this task is scheduled against */}
            <Button
              variant="outline"
              onClick={() => setContractId(s.contractId)}
              aria-label={`View the contract for ${s.task}`}
              className="rounded-full h-auto px-4 py-1.5 text-xs text-gray-700 cursor-pointer shrink-0"
            >
              View
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
