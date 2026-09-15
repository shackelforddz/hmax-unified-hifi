"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar, Key, ShoppingCart, Heart, BarChart2, FileText,
  Library, ArrowUp, UserRoundPlus, X,
  TrendingUp, RefreshCw, ClipboardList, Wrench, Stethoscope, Search, Activity,
} from "lucide-react";
import ContextPanel from "./context-panel";
import EntityContextPanel from "./context-panel-entity";
import DocPanel from "./doc-panel";
import ConversationPeople from "./conversation-people";
import { ChatThread, type AssignedTask, type ChatMsg, type StoredConversation } from "./chat-panel";
import { PEOPLE, type Person } from "@/lib/people-data";
import { answerQuery, detectCustomer, suggestNext, visualFor } from "@/lib/knowledge-base";
import { flowFor, flowById } from "@/lib/guided-flows";
import { type Playbook } from "@/lib/alert-playbooks";
import DocumentViewer, { type ViewDoc } from "@/components/dashboard/sales/document-viewer";
import { type ContextEntity } from "@/components/dashboard/conversation-launcher";
import { useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";

interface WelcomeSet {
  suggestions: { icon: React.ElementType; label: string }[];
  starters: string[];
  defaultPrompt: string;
}

// New-conversation content, tailored to the active persona.
const WELCOME_BY_ROLE: Record<string, WelcomeSet> = {
  "Project Manager": {
    suggestions: [
      { icon: Calendar, label: "Create a new mobilization plan" },
      { icon: Key, label: "Mobilize Xcel Next" },
      { icon: ShoppingCart, label: "Order a part?" },
      { icon: Heart, label: "Evaluate asset risk/health" },
      { icon: BarChart2, label: "Create an impact report" },
      { icon: FileText, label: "Create an invoice" },
    ],
    starters: [
      "What needs my attention today?",
      "Show the portfolio overview",
      "Which contracts are at risk?",
      "Why is on-time delivery falling?",
      "What's driving revenue at risk?",
      "Show vendor concentration",
    ],
    defaultPrompt: "Create a mobilization plan for Xcel Energy",
  },
  Sales: {
    suggestions: [
      { icon: TrendingUp, label: "Build a new lead" },
      { icon: RefreshCw, label: "Prepare an SLA renewal" },
      { icon: FileText, label: "Draft a service offer" },
      { icon: Heart, label: "Evaluate asset risk/health" },
      { icon: BarChart2, label: "Create an impact report" },
      { icon: Search, label: "Summarize an account" },
    ],
    starters: [
      "What's my pipeline value?",
      "Which leads need attention?",
      "Which SLAs renew soon?",
      "What's the weighted forecast?",
      "Which assets are critical?",
      "Show fleet health",
    ],
    defaultPrompt: "Summarize my lead pipeline",
  },
  Operations: {
    suggestions: [
      { icon: ClipboardList, label: "Raise a change order" },
      { icon: RefreshCw, label: "Rebalance the crew" },
      { icon: Calendar, label: "Adjust a contract schedule" },
      { icon: Wrench, label: "Create a contract" },
      { icon: BarChart2, label: "Create an impact report" },
      { icon: FileText, label: "Create an invoice" },
    ],
    starters: [
      "What needs my attention today?",
      "Which contracts are critical?",
      "What change orders are unsigned?",
      "How is margin vs plan?",
      "Where are we short on resources?",
      "Which HSE complaints are open?",
    ],
    defaultPrompt: "Show contracts needing attention",
  },
  "Reliability Engineer": {
    suggestions: [
      { icon: Search, label: "Review a service scope" },
      { icon: FileText, label: "Check design drawings" },
      { icon: Activity, label: "Assess asset feasibility" },
      { icon: Wrench, label: "Draft a maintenance procedure" },
      { icon: ClipboardList, label: "Log a site constraint" },
      { icon: BarChart2, label: "Create an impact report" },
    ],
    starters: [
      "What needs my review today?",
      "Which scopes are not feasible?",
      "Which assets need design review?",
      "What new standards apply?",
      "Where do handover and site conflict?",
      "Show fleet health",
    ],
    defaultPrompt: "Review the Xcel Energy service scope",
  },
  Diagnostics: {
    suggestions: [
      { icon: Stethoscope, label: "Interpret a field report" },
      { icon: Activity, label: "Review a DGA trend" },
      { icon: Search, label: "Assess a fault signature" },
      { icon: UserRoundPlus, label: "Dispatch a field engineer" },
      { icon: Wrench, label: "Draft a diagnostic procedure" },
      { icon: BarChart2, label: "Create an impact report" },
    ],
    starters: [
      "Which reports await interpretation?",
      "Which assets have a fault signature?",
      "How long do field reports take?",
      "Which DGA trends are concerning?",
      "Who is available to inspect?",
      "Show fleet health",
    ],
    defaultPrompt: "Interpret the AST-001 thermal report",
  },
};

function welcomeFor(role: string): WelcomeSet {
  return WELCOME_BY_ROLE[role] ?? WELCOME_BY_ROLE["Project Manager"];
}

interface Props {
  visible: boolean;
  onClose: () => void;
  /** When launched from a widget: the widget's name, shown as context. */
  context?: string;
  /** When launched from a widget: the user's typed prompt to seed the chat. */
  initialPrompt?: string;
  /** The record this conversation is about - drives the left context pane. */
  entity?: ContextEntity;
  /** An alert playbook to open with: situation + recommendation + next steps. */
  playbook?: Playbook;
  /** When reopening from the list: the stored conversation to restore. */
  restore?: StoredConversation | null;
  /** Called as the conversation is created/updated so it can be saved to the list. */
  onPersist?: (record: StoredConversation) => void;
}

export default function ConversationOverlay({ visible, onClose, context, initialPrompt, entity, playbook, restore, onPersist }: Props) {
  const selectedRole = useAppSelector((s) => s.auth.selectedRole);
  const welcome = welcomeFor(selectedRole);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [typing, setTyping] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [docVisible, setDocVisible] = useState(false);
  const [input, setInput] = useState("");
  const [activeContext, setActiveContext] = useState<string | undefined>(undefined);
  const [activeEntity, setActiveEntity] = useState<ContextEntity | null>(null);
  const [detectedCustomer, setDetectedCustomer] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Person[]>([]);
  const [viewDoc, setViewDoc] = useState<ViewDoc | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const idRef = useRef(0);
  const nextId = () => ++idRef.current;
  const sessionIdRef = useRef<string | null>(null);
  const onPersistRef = useRef(onPersist);
  onPersistRef.current = onPersist;

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const push = (msg: Omit<ChatMsg, "id">) => setMessages((m) => [...m, { id: nextId(), ...msg }]);

  // Generate the assistant's reply - mobilization / lead prompts open a
  // guided wizard, everything else is answered from the knowledge base.
  const respond = (text: string, ctx?: string) => {
    setTyping(true);
    clearTimers();
    const q = text.toLowerCase();
    const isMob = /mobili[sz]|mobilization plan|mobilisation plan/.test(q);
    const isOpp = /opportunit|\blead/.test(q) && /(build|create|new|start|open)/.test(q);
    const flow = !isMob && !isOpp ? flowFor(text) : undefined;
    if (isMob) {
      // The demo mobilization plan is tied to the Xcel Energy contract
      // (Sherco HVDC) - surface its detail in the context pane.
      setActiveEntity((prev) => prev ?? { kind: "contract", id: "ct-sherco" });
      timers.current.push(
        setTimeout(() => push({ role: "ai", kind: "text", text: "Of course - let's confirm a few details and I'll draft the plan." }), 1000)
      );
      timers.current.push(
        setTimeout(() => {
          setTyping(false);
          push({ role: "ai", kind: "wizard" });
        }, 2100)
      );
    } else if (isOpp) {
      setWizardStep(1);
      timers.current.push(
        setTimeout(() => push({ role: "ai", kind: "text", text: "Let's build a new lead - I'll walk you through it and pre-fill what I can." }), 1000)
      );
      timers.current.push(
        setTimeout(() => {
          setTyping(false);
          push({ role: "ai", kind: "opp-wizard" });
        }, 2100)
      );
    } else if (flow) {
      setWizardStep(1);
      if (flow.entity) setActiveEntity((prev) => prev ?? flow.entity ?? null);
      timers.current.push(
        setTimeout(() => push({ role: "ai", kind: "text", text: flow.intro }), 1000)
      );
      timers.current.push(
        setTimeout(() => {
          setTyping(false);
          push({ role: "ai", kind: "flow", flowId: flow.id });
        }, 2100)
      );
    } else {
      timers.current.push(
        setTimeout(() => {
          setTyping(false);
          push({ role: "ai", kind: "text", text: answerQuery(text, ctx), suggestions: suggestNext(text, ctx), visual: visualFor(text, ctx) ?? undefined });
        }, 1000)
      );
    }
  };

  const send = (text: string, ctx?: string) => {
    const t = text.trim();
    if (!t) return;
    if (!sessionIdRef.current) sessionIdRef.current = `conv-${Date.now()}`;
    setStarted(true);
    setInput("");
    push({ role: "user", text: t });
    // Tie the conversation to a customer once one is mentioned
    const who = detectCustomer(t);
    if (who) setDetectedCustomer((prev) => prev ?? who);
    respond(t, ctx ?? activeContext);
  };

  // Coworkers join in-thread, so the transcript shows when they arrived
  // relative to what had already been said.
  const addPerson = (person: Person) => {
    if (participants.some((p) => p.id === person.id)) return;
    setParticipants((prev) => [...prev, person]);
    push({ role: "ai", kind: "event", text: `${person.name} · ${person.role} joined the conversation` });
  };

  const removePerson = (person: Person) => {
    setParticipants((prev) => prev.filter((p) => p.id !== person.id));
    push({ role: "ai", kind: "event", text: `${person.name} left the conversation` });
  };

  const assignTask = (task: AssignedTask) => push({ role: "ai", kind: "task", task });

  // Open an alert conversation with a grounded playbook: the situation (data),
  // a recommendation, then next-step buttons - many of which start a wizard.
  const startPlaybook = (pb: Playbook, action: string, ctx?: string) => {
    if (!sessionIdRef.current) sessionIdRef.current = `conv-${Date.now()}`;
    setStarted(true);
    clearTimers();
    setTyping(true);
    push({ role: "user", text: action });
    timers.current.push(
      setTimeout(() => push({ role: "ai", kind: "text", text: pb.situation }), 900)
    );
    timers.current.push(
      setTimeout(() => {
        setTyping(false);
        const recommendation: Omit<ChatMsg, "id"> = {
          role: "ai",
          kind: "text",
          text: `Recommendation - ${pb.recommendation}`,
          suggestions: { prompts: [], actions: pb.steps },
        };
        // For a recap (e.g. a reviewed document) the flow reads best as
        // summary → linked document → recommendation + next steps, so the
        // recommendation is pushed last and its next-step buttons show.
        if (pb.panel?.kind === "recap") {
          push({ role: "ai", kind: "panel", panel: pb.panel });
          push(recommendation);
        } else {
          push(recommendation);
          if (pb.panel) push({ role: "ai", kind: "panel", panel: pb.panel });
        }
      }, 1900)
    );
    // Keep the widget context / customer in sync for the left pane.
    if (ctx) {
      const who = detectCustomer(ctx);
      if (who) setDetectedCustomer((prev) => prev ?? who);
    }
  };

  // Reset the whole overlay whenever it is dismissed
  useEffect(() => {
    if (!visible) {
      clearTimers();
      setStarted(false);
      setMessages([]);
      setTyping(false);
      setWizardStep(1);
      setDocVisible(false);
      setInput("");
      setActiveContext(undefined);
      setActiveEntity(null);
      setDetectedCustomer(null);
      setParticipants([]);
      setViewDoc(null);
      idRef.current = 0;
      sessionIdRef.current = null;
    }
  }, [visible]);

  // Reopen a saved conversation from the list.
  useEffect(() => {
    if (visible && restore && !started) {
      sessionIdRef.current = restore.id;
      setActiveContext(restore.context);
      setActiveEntity(restore.entity ?? null);
      setDetectedCustomer(restore.detectedCustomer ?? null);
      setParticipants(
        (restore.participantIds ?? []).map((id) => PEOPLE.find((p) => p.id === id)).filter((p): p is Person => !!p)
      );
      if (restore.messages.length > 0) {
        // Restore the existing thread
        idRef.current = restore.messages.reduce((m, x) => Math.max(m, x.id), 0);
        setMessages(restore.messages);
        setStarted(true);
      } else {
        // Seed conversation with no thread yet - run its prompt fresh
        send(restore.seedPrompt || restore.title, restore.context);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, restore]);

  // When launched from a widget, skip the welcome screen and start immediately
  // with the widget context pinned to the top of the conversation.
  useEffect(() => {
    if (visible && (context || entity || initialPrompt || playbook) && !restore && !started) {
      if (context) setActiveContext(context);
      if (entity) setActiveEntity(entity);
      if (playbook) {
        startPlaybook(playbook, (initialPrompt || "").trim() || "Help with this", context);
      } else {
        send((initialPrompt || "").trim() || `Tell me about ${context}`, context);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, context, entity, initialPrompt, playbook]);

  // Persist the conversation to the list as it's created and updated.
  useEffect(() => {
    if (!started || !sessionIdRef.current || messages.length === 0) return;
    const firstUser = messages.find((m) => m.role === "user")?.text ?? "";
    const last = messages[messages.length - 1];
    const title = activeContext || firstUser || "Conversation";
    const preview = last.kind === "wizard" ? "Guided plan in progress…" : (last.text ?? firstUser);
    onPersistRef.current?.({
      id: sessionIdRef.current,
      title,
      preview,
      date: "Now",
      context: activeContext,
      entity: activeEntity ?? undefined,
      detectedCustomer,
      participantIds: participants.map((p) => p.id),
      messages,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, started, activeContext, activeEntity, detectedCustomer, participants]);

  useEffect(() => clearTimers, []);

  // Close the overlay on Escape
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, onClose]);

  // Keep pinned to the newest content as the conversation streams in
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing, started]);

  const handleSend = () => {
    const t = input.trim();
    if (!t && !started) send(welcome.defaultPrompt);
    else if (t) send(t);
  };

  // Final step of the lead wizard - confirm creation.
  const oppCreate = () => {
    setTyping(true);
    clearTimers();
    timers.current.push(
      setTimeout(() => {
        setTyping(false);
        push({
          role: "ai",
          kind: "text",
          text:
            "✓ Lead created and added to your pipeline.\n\nDuke Energy - Fleet reliability program is now in Discovery ($5.4M, Premium). Next steps: qualify the budget and capture the account & shipping details to move it toward Scoping.",
          suggestions: {
            prompts: ["What's needed to reach the Offer stage?", "Show the Duke Energy fleet", "Draft a qualification plan"],
            actions: [
              { label: "Capture account details", prompt: "Capture account and shipping details for Duke Energy" },
              { label: "Assign owner", prompt: "Assign an owner to the Duke Energy lead" },
            ],
          },
        });
      }, 1000)
    );
  };

  // Final step of a generic guided flow - confirm the action.
  const flowComplete = (flowId: string) => {
    const flow = flowById(flowId);
    setTyping(true);
    clearTimers();
    timers.current.push(
      setTimeout(() => {
        setTyping(false);
        push({
          role: "ai",
          kind: "text",
          text: flow?.done ?? "✓ Done.",
          suggestions: flow?.doneSuggestions
            ? { prompts: flow.doneSuggestions, actions: [] }
            : undefined,
        });
      }, 1000)
    );
  };

  // The left context pane only ever shows detail content for a real record -
  // an asset, contract, lead, or customer. It appears when a record is
  // pinned (activeEntity) or a customer is identified from the conversation;
  // otherwise there is no pane (no placeholder / default account).
  const showPanel = started && (!!activeEntity || !!detectedCustomer);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`fixed inset-0 p-4 z-50 flex transition-opacity duration-300 ${
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      style={{
        background: started ? "rgba(245,245,245,0.7)" : "rgba(245,245,245,0.8)",
        backdropFilter: started ? "blur(16px)" : "blur(16px)",
        WebkitBackdropFilter: started ? "blur(16px)" : "blur(16px)",
        transition: "background 500ms ease, backdrop-filter 500ms ease, opacity 300ms ease",
      }}
    >
      {/* Backdrop click closes only before a conversation has started */}
      {!started && <div className="absolute inset-0" onClick={onClose} />}

      {/* Close button - the header X only exists once a conversation starts */}
      {!started && (
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-6 right-6 z-20 w-9 h-9 rounded-full bg-white/70 backdrop-blur flex items-center justify-center text-gray-500 hover:bg-white transition-colors cursor-pointer"
        >
          <X size={18} strokeWidth={1.5} />
        </button>
      )}

      {/* Left - customer context. For widget-launched chats it stays hidden
          until the conversation is tied to a specific customer. */}
      <div
        className={`relative z-10 rounded-lg shrink-0 overflow-hidden transition-[width] duration-500 ease-in-out ${
          showPanel ? "w-[420px]" : "w-0"
        }`}
      >
        <div
          className={`w-[420px] h-full transition-transform duration-500 ease-in-out ${
            showPanel ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {activeEntity ? (
            <EntityContextPanel entity={activeEntity} onAction={(t) => send(t)} />
          ) : detectedCustomer ? (
            <ContextPanel customer={detectedCustomer} />
          ) : null}
        </div>
      </div>

      {/* Right - welcome → conversation (prompt box is the fixed anchor) */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col">
        {/* Header - fades in once started */}
        <div
          className={`relative z-20 shrink-0 transition-all duration-500 ${
            started ? "opacity-100 max-h-20" : "opacity-0 max-h-0 overflow-hidden"
          }`}
        >
          <div className="max-w-[640px] mx-auto w-full px-4 flex items-center justify-between gap-3 pt-7 pb-5">
            <h2 className="text-xl text-gray-900 truncate min-w-0">
              {activeContext ?? messages.find((m) => m.role === "user")?.text ?? "New conversation"}
            </h2>
            <div className="flex items-center gap-1 shrink-0">
              <ConversationPeople
                participants={participants}
                onAdd={addPerson}
                onRemove={removePerson}
                onAssign={assignTask}
              />
              <button
                onClick={onClose}
                aria-label="Close conversation"
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X size={17} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Content area above the prompt */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth flex flex-col">
          <div className={`max-w-[640px] mx-auto w-full px-4 ${started ? "" : "flex-1 flex flex-col items-center justify-center"}`}>
            {!started ? (
              /* Welcome */
              <div className="w-full animate-message-in">
                <h1 className="font-patrick-hand text-3xl text-gray-900 text-center mb-10">
                  Create A New Conversation
                </h1>
                <div className="grid grid-cols-3 gap-3">
                  {welcome.suggestions.map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      onClick={() => send(label)}
                      className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <Icon size={16} strokeWidth={1.5} className="text-gray-400 mb-2 group-hover:text-gray-700" />
                      <p className="text-sm text-gray-600 leading-snug">{label}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Conversation */
              <ChatThread
                messages={messages}
                typing={typing}
                context={activeContext}
                wizardStep={wizardStep}
                onWizardStep={setWizardStep}
                onGenerate={() => setDocVisible(true)}
                onOppCreate={oppCreate}
                onFlowComplete={flowComplete}
                onOpenDoc={setViewDoc}
                onSend={(t) => send(t)}
              />
            )}
          </div>
        </div>

        {/* Persistent prompt box - the anchor that never swaps out */}
        <div className="shrink-0 pb-6 pt-2">
          {/* Suggested starter prompts (welcome screen only) */}
          {!started && (
            <div className="max-w-[640px] mx-auto w-full px-4 mb-2">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {welcome.starters.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="shrink-0 whitespace-nowrap text-xs text-gray-600 bg-white border border-gray-200 rounded-full px-3 py-1.5 hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="max-w-[640px] mx-auto w-full px-4">
            <div className="bg-white border border-gray-200 rounded-2xl flex items-center gap-3 px-4 py-3 shadow-sm">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={started ? "Message..." : welcome.defaultPrompt}
                className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
                autoFocus
              />
              <Library size={16} strokeWidth={1.5} className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors shrink-0" />
              <Button onClick={handleSend} className="rounded-full size-8 p-0 shrink-0 cursor-pointer">
                <ArrowUp size={14} strokeWidth={2} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Document panel - pushes in from the right, mirroring the context panel */}
      <div
        className={`relative z-10 shrink-0 overflow-hidden transition-[width] duration-500 ease-in-out ${
          docVisible ? "w-[460px]" : "w-0"
        }`}
      >
        <div
          className={`w-[460px] h-full transition-transform duration-500 ease-in-out ${
            docVisible ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <DocPanel onClose={() => setDocVisible(false)} />
        </div>
      </div>

      {/* Linked document (e.g. a change order opened from a playbook recap) */}
      <DocumentViewer
        doc={viewDoc}
        onClose={() => setViewDoc(null)}
        onAsk={(doc) => {
          setViewDoc(null);
          send(`Walk me through ${doc.title} (${doc.ref})`);
        }}
      />
    </div>
  );
}
