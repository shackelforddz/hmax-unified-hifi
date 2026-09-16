"use client";

import { useState, useCallback } from "react";
import SideNav from "@/components/dashboard/side-nav";
import ConversationsPanel from "@/components/dashboard/conversations-panel";
import PmDashboard from "@/components/dashboard/pm-dashboard";
import SalesDashboard from "@/components/dashboard/sales-dashboard";
import OperationsDashboard from "@/components/dashboard/operations-dashboard";
import ReliabilityDashboard from "@/components/dashboard/reliability-dashboard";
import DiagnosticsDashboard from "@/components/dashboard/diagnostics-dashboard";
import ConversationOverlay from "@/components/conversation/conversation-overlay";
import { type StoredConversation } from "@/components/conversation/chat-panel";
import { DetailDrawerProvider } from "@/components/dashboard/detail-drawers";
import { ConversationLauncherContext, type LaunchArgs } from "@/components/dashboard/conversation-launcher";
import { useAppSelector } from "@/store/hooks";

export default function DashboardPage() {
  const [conv, setConv] = useState<{ visible: boolean; context?: string; prompt?: string; entity?: LaunchArgs["entity"]; playbook?: LaunchArgs["playbook"]; restore?: StoredConversation | null }>({ visible: false });
  // First-time login - the conversation history starts empty.
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const selectedRole = useAppSelector((s) => s.auth.selectedRole);
  const isSales = selectedRole === "Sales";
  const isOps = selectedRole === "Operations";
  const isReliability = selectedRole === "Reliability Engineer";
  const isDiagnostics = selectedRole === "Diagnostics";

  const openConversation = useCallback((args?: LaunchArgs) => {
    setConv({ visible: true, context: args?.context, prompt: args?.prompt, entity: args?.entity, playbook: args?.playbook, restore: null });
  }, []);

  const openStored = useCallback((rec: StoredConversation) => {
    setConv({ visible: true, restore: rec });
  }, []);

  const persist = useCallback((record: StoredConversation) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === record.id);
      if (idx === -1) return [record, ...prev];
      const next = [...prev];
      next[idx] = record;
      return next;
    });
  }, []);

  return (
    <ConversationLauncherContext.Provider value={openConversation}>
    <DetailDrawerProvider>
    <div className="h-screen bg-[#F5F5F5] overflow-hidden flex">

      {/* Rail - wordmark up top, utilities and account at the foot */}
      <SideNav />

      {/* Main panel - the dashboard lives on one white sheet */}
      <main className="flex-1 min-w-0 my-4 bg-white rounded-2xl overflow-hidden flex flex-col">
        <div className="no-scrollbar flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col gap-4">
            {isSales ? <SalesDashboard /> : isOps ? <OperationsDashboard /> : isReliability ? <ReliabilityDashboard /> : isDiagnostics ? <DiagnosticsDashboard /> : <PmDashboard />}
          </div>
        </div>
      </main>

      {/* Conversation log */}
      <aside className="w-[400px] shrink-0 px-6 py-6">
        <ConversationsPanel
          conversations={conversations}
          onNewConversation={() => openConversation()}
          onSelect={openStored}
          onStartPrompt={(prompt) => openConversation({ prompt })}
        />
      </aside>

      {/* Unified conversation overlay - welcome → chat on one screen */}
      <ConversationOverlay
        visible={conv.visible}
        context={conv.context}
        initialPrompt={conv.prompt}
        entity={conv.entity}
        playbook={conv.playbook}
        restore={conv.restore}
        onPersist={persist}
        onClose={() => setConv((c) => ({ ...c, visible: false }))}
      />
    </div>
    </DetailDrawerProvider>
    </ConversationLauncherContext.Provider>
  );
}
