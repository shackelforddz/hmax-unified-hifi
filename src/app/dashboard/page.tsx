"use client";

import { useState, useCallback } from "react";
import TopNav from "@/components/dashboard/top-nav";
import ConversationsPanel from "@/components/dashboard/conversations-panel";
import PmDashboard from "@/components/dashboard/pm-dashboard";
import SalesDashboard from "@/components/dashboard/sales-dashboard";
import OperationsDashboard from "@/components/dashboard/operations-dashboard";
import ReliabilityDashboard from "@/components/dashboard/reliability-dashboard";
import DiagnosticsDashboard from "@/components/dashboard/diagnostics-dashboard";
import ConversationOverlay from "@/components/conversation/conversation-overlay";
import { type StoredConversation } from "@/components/conversation/chat-panel";
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
    <div className="h-screen bg-[#F5F5F5] font-patrick-hand relative overflow-hidden">

      {/* Right conversations panel - anchored below nav, never scrolls under it */}
      <div className="absolute top-[80px] right-4 bottom-4 w-[400px]">
        <ConversationsPanel
          conversations={conversations}
          onNewConversation={() => openConversation()}
          onSelect={openStored}
          onStartPrompt={(prompt) => openConversation({ prompt })}
        />
      </div>

      {/* Left content - starts at top-0 so it can scroll under the nav */}
      {/* right = 16px page pad + 400px panel + 16px gap = 432px */}
      <div className="no-scrollbar absolute top-0 left-0 bottom-0 overflow-y-auto" style={{ right: 432 }}>
        <div className="pl-4 pb-4 pt-[80px] flex flex-col gap-4">
          {isSales ? <SalesDashboard /> : isOps ? <OperationsDashboard /> : isReliability ? <ReliabilityDashboard /> : isDiagnostics ? <DiagnosticsDashboard /> : <PmDashboard />}
        </div>
      </div>

      {/* Progressive blur - covers exactly the nav zone (0–64px) */}
      <div className="absolute top-0 left-0 right-0 z-20 h-[64px] pointer-events-none overflow-hidden">
        <div style={{
          position: "absolute", inset: 0,
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          maskImage: "linear-gradient(to bottom, black 0%, black 10%, transparent 40%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 10%, transparent 40%)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          maskImage: "linear-gradient(to bottom, black 0%, black 30%, transparent 65%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 30%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
          maskImage: "linear-gradient(to bottom, black 0%, black 50%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 50%, transparent 100%)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(245,245,245,0.97) 0%, rgba(245,245,245,0.55) 55%, rgba(245,245,245,0) 100%)",
        }} />
      </div>

      {/* Nav content - above blur layers */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-4 pointer-events-none">
        <div className="pointer-events-auto">
          <TopNav />
        </div>
      </div>

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
    </ConversationLauncherContext.Provider>
  );
}
