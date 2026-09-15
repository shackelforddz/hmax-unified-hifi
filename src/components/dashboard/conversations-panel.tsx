"use client";

import { SlidersVertical, ArrowUpRight, Plus, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StoredConversation } from "@/components/conversation/chat-panel";
import { useAppSelector } from "@/store/hooks";
import { recommendedTasksFor, recommendedActionsFor } from "@/lib/conversation-suggestions";

interface Props {
  conversations: StoredConversation[];
  onNewConversation?: () => void;
  onSelect?: (conversation: StoredConversation) => void;
  onStartPrompt?: (prompt: string) => void;
}

export default function ConversationsPanel({ conversations, onNewConversation, onSelect, onStartPrompt }: Props) {
  const selectedRole = useAppSelector((s) => s.auth.selectedRole);
  // One merged list of things to try - deep-dive questions and quick actions
  // interleaved so the two kinds alternate rather than grouping together.
  const asks = recommendedTasksFor(selectedRole).map((t) => ({ ...t, kind: "ask" as const }));
  const tasks = recommendedActionsFor(selectedRole).map((t) => ({ ...t, kind: "task" as const }));
  const cards = Array.from({ length: Math.max(asks.length, tasks.length) }).flatMap((_, i) =>
    [asks[i], tasks[i]].filter(Boolean)
  );

  return (
    <div className="h-full bg-zinc-900 rounded-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 shrink-0">
        <h2 className="text-white text-lg mb-4">Conversations</h2>

        {/* Search bar */}
        <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2">
          <input
            type="text"
            placeholder="Search conversations..."
            className="flex-1 bg-transparent text-sm text-zinc-300 placeholder-zinc-500 outline-none"
          />
          <SlidersVertical size={14} strokeWidth={1.5} className="text-zinc-500 shrink-0" />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-3 flex flex-col gap-2 pb-2">
        {conversations.length > 0 ? (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect?.(conv)}
              className="w-full text-left px-3 py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-sm text-white leading-snug line-clamp-1">{conv.title}</span>
                <span className="text-xs text-zinc-500 shrink-0 mt-0.5">{conv.date}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{conv.preview}</p>
            </button>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
            <div className="w-11 h-11 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
              <MessageSquarePlus size={18} strokeWidth={1.5} className="text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-300">No conversations yet</p>
            <p className="text-xs text-zinc-500 leading-relaxed mt-1">
              Start a new conversation, open one from any widget, or pick a recommended task below.
            </p>
          </div>
        )}
      </div>

      {/* Bottom section - recommendations (when empty) + New Conversation */}
      <div className="shrink-0 border-t border-zinc-800">
        {conversations.length === 0 && (
          <div className="px-4 pt-4">
            <div className="mb-2.5 px-1">
              <span className="text-[11px] tracking-wider text-zinc-500">Recommended for you</span>
            </div>

            {/* Horizontal scroll card list - deep-dives and quick actions together.
                Left aligns with the header; right bleeds for scroll affordance. */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mr-4 pr-4 pl-1 snap-x">
              {cards.map((card) => (
                <button
                  key={`${card.kind}-${card.label}`}
                  onClick={() => onStartPrompt?.(card.prompt)}
                  className="shrink-0 snap-start w-[170px] h-[104px] text-left p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer flex flex-col justify-between group"
                >
                  <span className="w-7 h-7 rounded-md bg-zinc-700 group-hover:bg-zinc-600 flex items-center justify-center shrink-0 transition-colors">
                    {card.kind === "task" ? (
                      <Plus size={15} strokeWidth={1.5} className="text-zinc-300" />
                    ) : (
                      <ArrowUpRight size={15} strokeWidth={1.5} className="text-zinc-300" />
                    )}
                  </span>
                  <span className="text-sm text-zinc-200 leading-snug line-clamp-2">{card.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* New Conversation button */}
        <div className="p-4">
          <Button
            onClick={onNewConversation}
            className="w-full rounded-full h-auto py-3 text-sm bg-white text-black hover:bg-zinc-100 cursor-pointer"
          >
            New Conversation
          </Button>
        </div>
      </div>
    </div>
  );
}
