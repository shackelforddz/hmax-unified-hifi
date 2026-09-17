"use client";

import { useEffect, useRef, useState } from "react";
import { Search, EllipsisVertical, ArrowUpRight, MessagesSquare, Share2, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StoredConversation } from "@/components/conversation/chat-panel";
import { useAppSelector } from "@/store/hooks";
import { recommendedTasksFor, recommendedActionsFor } from "@/lib/conversation-suggestions";

interface Props {
  conversations: StoredConversation[];
  onNewConversation?: () => void;
  onSelect?: (conversation: StoredConversation) => void;
  onStartPrompt?: (prompt: string) => void;
  onDelete?: (conversation: StoredConversation) => void;
}

/** Conversations arrive with a display date ("Now", "Oct 10"); group the live
 *  ones under Today and everything else under its own heading. */
function group(conversations: StoredConversation[]): [string, StoredConversation[]][] {
  const out = new Map<string, StoredConversation[]>();
  for (const c of conversations) {
    const key = c.date === "Now" || c.date === "Today" ? "Today" : c.date;
    out.set(key, [...(out.get(key) ?? []), c]);
  }
  return [...out.entries()];
}

interface Suggestion {
  label: string;
  prompt: string;
}

/** Nothing in the history yet - say so plainly, then hand the user a short list
 *  of openers picked for the role they signed in as. */
function EmptyState({
  suggestions,
  onStartPrompt,
}: {
  suggestions: Suggestion[];
  onStartPrompt?: (prompt: string) => void;
}) {
  return (
    // One panel that takes whatever height the pane has spare, with the
    // message and its openers centred together inside it.
    <div className="h-full min-h-[320px] flex flex-col justify-center gap-6">
      <div className="flex flex-col items-center text-center gap-2">
        <span className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-gray-400">
          <MessagesSquare size={22} strokeWidth={1.5} />
        </span>
        <p className="text-base font-bold text-gray-900 leading-5">No active conversations</p>
        <p className="text-sm text-gray-500 leading-5">
          Nothing in progress right now. Start a new conversation, or pick one of the openers below.
        </p>
      </div>

      <div className="shrink-0 grid grid-cols-2 gap-3">
        {suggestions.map((s) => (
          <button
            key={s.label}
            onClick={() => onStartPrompt?.(s.prompt)}
            className="min-h-24 bg-[rgba(34,34,34,0.05)] hover:bg-[rgba(34,34,34,0.09)] rounded-xl px-4 py-3 flex flex-col gap-2 text-left transition-colors cursor-pointer"
          >
            {/* The label needs its own box: a flex item is blockified, which
                would drop the -webkit-box display line-clamp relies on. */}
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-gray-900 leading-5 line-clamp-4">{s.label}</span>
            </span>
            <ArrowUpRight size={15} strokeWidth={1.5} className="text-gray-400 shrink-0 self-end" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* The card's ⋮ menu. It renders fixed to the viewport so the scrolling
   history list can't clip it. Delete asks once before it removes anything. */
function ConversationMenu({ c, onDelete }: { c: StoredConversation; onDelete?: (c: StoredConversation) => void }) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setPos(null);
    setConfirming(false);
    setCopied(false);
  };

  useEffect(() => {
    if (!pos) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !buttonRef.current?.contains(t)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [pos]);

  const toggle = () => {
    if (pos) return close();
    const r = buttonRef.current!.getBoundingClientRect();
    setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
  };

  const share = async () => {
    const link = `${window.location.origin}/dashboard?conversation=${encodeURIComponent(c.id)}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      /* clipboard blocked - nothing else to fall back to in the demo */
    }
    setCopied(true);
    setTimeout(close, 1200);
  };

  const item = "w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors cursor-pointer";

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggle}
        aria-label="Conversation actions"
        aria-haspopup="menu"
        aria-expanded={!!pos}
        className="shrink-0 size-6 -m-1 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-black/5 transition-colors cursor-pointer"
      >
        <EllipsisVertical size={16} />
      </button>

      {pos && (
        <div
          ref={menuRef}
          role="menu"
          className="fixed z-50 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-1 animate-message-in"
          style={{ top: pos.top, right: pos.right }}
        >
          {confirming ? (
            <div className="p-2">
              <p className="text-sm font-bold text-gray-950">Delete conversation?</p>
              <p className="text-xs text-gray-500 mt-0.5">This removes it from your history.</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={close}
                  className="flex-1 h-8 rounded-full border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    close();
                    onDelete?.(c);
                  }}
                  className="flex-1 h-8 rounded-full bg-status-critical text-sm font-bold text-white hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <>
              <button role="menuitem" onClick={share} className={`${item} text-gray-800 hover:bg-gray-50`}>
                {copied ? <Check size={15} className="text-gray-500 shrink-0" /> : <Share2 size={15} strokeWidth={1.5} className="text-gray-500 shrink-0" />}
                {copied ? "Link copied" : "Share conversation"}
              </button>
              <button role="menuitem" onClick={() => setConfirming(true)} className={`${item} text-status-critical hover:bg-red-50`}>
                <Trash2 size={15} strokeWidth={1.5} className="shrink-0" />
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

function ConversationCard({ c, onSelect, onDelete }: { c: StoredConversation; onSelect?: (c: StoredConversation) => void; onDelete?: (c: StoredConversation) => void }) {
  return (
    <div className="bg-[rgba(34,34,34,0.05)] hover:bg-[rgba(34,34,34,0.09)] rounded-[10px] p-6 flex items-center gap-4 transition-colors">
      <button onClick={() => onSelect?.(c)} className="flex-1 min-w-0 text-left text-gray-950 cursor-pointer">
        <p className="text-sm font-bold leading-5">{c.title}</p>
        <p className="text-xs leading-4 opacity-50 mt-2 line-clamp-3">{c.preview}</p>
      </button>
      <ConversationMenu c={c} onDelete={onDelete} />
    </div>
  );
}

export default function ConversationsPanel({ conversations, onNewConversation, onSelect, onStartPrompt, onDelete }: Props) {
  const selectedRole = useAppSelector((s) => s.auth.selectedRole);
  const [query, setQuery] = useState("");

  // A couple of questions to ask, then a couple of things to start.
  const recommended = [...recommendedTasksFor(selectedRole).slice(0, 2), ...recommendedActionsFor(selectedRole).slice(0, 2)];

  const q = query.trim().toLowerCase();
  const filtered = q
    ? conversations.filter((c) => c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q))
    : conversations;
  const groups = group(filtered);

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden">
      {/* Prompt */}
      <div className="shrink-0 flex flex-col gap-6">
        <div className="text-3xl font-bold leading-10 text-gray-900">
          <p>Hey, Need Help?</p>
          <p className="opacity-50">Ask HMAX Anything!</p>
        </div>

        {/* Nothing to search through until there is a history */}
        {conversations.length > 0 && (
          <div className="flex items-center gap-1.5 h-8 px-2.5 py-1.5 bg-white border border-gray-200 rounded-full">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Conversations"
              className="flex-1 min-w-0 text-sm text-gray-700 placeholder-gray-500 outline-none bg-transparent"
            />
            <Search size={16} strokeWidth={1.5} className="text-gray-500 shrink-0" />
          </div>
        )}
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-4 -mr-2 pr-2">
        {groups.length > 0 ? (
          groups.map(([label, items]) => (
            <div key={label} className="flex flex-col gap-4">
              <h3 className="text-2xl text-gray-950 leading-8">{label}</h3>
              {items.map((c) => (
                <ConversationCard key={c.id} c={c} onSelect={onSelect} onDelete={onDelete} />
              ))}
            </div>
          ))
        ) : conversations.length > 0 ? (
          <p className="text-sm text-gray-400">No conversations match that search.</p>
        ) : (
          <EmptyState suggestions={recommended} onStartPrompt={onStartPrompt} />
        )}
      </div>

      {/* New conversation */}
      <Button onClick={onNewConversation} className="shrink-0 w-full h-12 rounded-full text-sm cursor-pointer">
        Ask HMAX
      </Button>
    </div>
  );
}
