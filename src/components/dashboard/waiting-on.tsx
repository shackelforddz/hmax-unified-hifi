"use client";

import { Clock } from "lucide-react";
import WidgetChat from "./widget-chat";
import { Button } from "@/components/ui/button";
import { useConversationLauncher } from "./conversation-launcher";
import { WAITING_ON } from "@/lib/waiting-on-data";

export default function WaitingOn() {
  const launch = useConversationLauncher();
  // Longest-waiting first - that's what you chase first.
  const items = [...WAITING_ON].sort((a, b) => b.waitingDays - a.waitingDays);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base text-gray-900">Waiting on</h3>
        </div>
        <WidgetChat title="Waiting on" />
      </div>

      {/* List */}
      <div className="flex flex-col">
        {items.map((w, i) => (
          <div
            key={w.id}
            className={`flex items-center gap-3 py-3 ${i < items.length - 1 ? "border-b border-gray-100" : ""}`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">{w.item}</p>
              <p className="text-xs text-gray-400 truncate">
                {w.waitingOn} • {w.context}
              </p>
            </div>
            <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0 whitespace-nowrap">
              <Clock size={12} strokeWidth={1.5} />
              {w.waitingDays}d
            </span>
            <Button
              variant="outline"
              onClick={() =>
                launch({
                  context: w.context,
                  prompt: `Draft a message chasing ${w.waitingOn} for ${w.item} on ${w.context}`,
                })
              }
              className="rounded-full h-auto px-4 py-1.5 text-xs text-gray-700 cursor-pointer shrink-0"
            >
              Follow up
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
