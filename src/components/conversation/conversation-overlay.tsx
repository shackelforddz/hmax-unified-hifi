"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar, Heart, FileText, NotepadText, Bolt,
  UserRoundPlus, X,
  TrendingUp, RefreshCw, ClipboardList, Wrench, Stethoscope, Search, Activity,
} from "lucide-react";
import EntityContextPanel from "./context-panel-entity";
import DocPanel from "./doc-panel";
import ConversationPeople from "./conversation-people";
import PromptBar from "./prompt-bar";
import ProgressiveBlur from "@/components/progressive-blur";
import { ChatThread, type AssignedTask, type ChatMsg, type StoredConversation } from "./chat-panel";
import { ALL_PEOPLE, type Person } from "@/lib/people-data";
import { answerQuery, detectCustomer, suggestNext, visualFor } from "@/lib/knowledge-base";
import { flowFor, flowById } from "@/lib/guided-flows";
import { type Playbook, type PlaybookPanel } from "@/lib/alert-playbooks";
import DocumentViewer, { type ViewDoc } from "@/components/dashboard/sales/document-viewer";
import { type ContextEntity } from "@/components/dashboard/conversation-launcher";
import { useAppSelector } from "@/store/hooks";

interface WelcomeSet {
  /** The four starting points shown under the prompt. `prompt` is what's
   *  sent when the card is picked; it defaults to the title. */
  suggestions: { icon: React.ElementType; title: string; sub: string; prompt?: string }[];
}

// New-conversation content, tailored to the active persona.
const WELCOME_BY_ROLE: Record<string, WelcomeSet> = {
  "Project Manager": {
    suggestions: [
      { icon: NotepadText, title: "New mobilization plan", sub: "Set up new mobilization workflow", prompt: "Create a new mobilization plan" },
      { icon: Wrench, title: "Schedule field work", sub: "Plan and assign field operations", prompt: "Schedule a field engineer" },
      { icon: Bolt, title: "Order a part", sub: "Request replacement component" },
      { icon: Heart, title: "Evaluate asset risk/health", sub: "Assess asset condition and risk" },
    ],
  },
  Sales: {
    suggestions: [
      { icon: TrendingUp, title: "Build a new lead", sub: "Start a lead and pre-fill what's known" },
      { icon: RefreshCw, title: "Prepare an SLA renewal", sub: "Draft the renewal for an expiring SLA" },
      { icon: FileText, title: "Draft a service offer", sub: "Put together scope and pricing" },
      { icon: Heart, title: "Evaluate asset risk/health", sub: "Assess asset condition and risk" },
    ],
  },
  Operations: {
    suggestions: [
      { icon: ClipboardList, title: "Raise a change order", sub: "Log scope changes for signature" },
      { icon: RefreshCw, title: "Rebalance the crew", sub: "Move work off over-allocated engineers" },
      { icon: Calendar, title: "Adjust a contract schedule", sub: "Recover a slipping delivery date" },
      { icon: FileText, title: "Create an invoice", sub: "Bill a completed milestone" },
    ],
  },
  "Reliability Engineer": {
    suggestions: [
      { icon: Search, title: "Review a service scope", sub: "Check feasibility against the asset" },
      { icon: FileText, title: "Check design drawings", sub: "Compare as-built with the design" },
      { icon: Activity, title: "Assess asset feasibility", sub: "Weigh condition against proposed work" },
      { icon: ClipboardList, title: "Log a site constraint", sub: "Record access or outage limits" },
    ],
  },
  Diagnostics: {
    suggestions: [
      { icon: Stethoscope, title: "Interpret a field report", sub: "Read findings from the field" },
      { icon: Activity, title: "Review a DGA trend", sub: "Spot developing gas faults" },
      { icon: Search, title: "Assess a fault signature", sub: "Diagnose what the data points to" },
      { icon: UserRoundPlus, title: "Dispatch a field engineer", sub: "Send someone to inspect" },
    ],
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

  const addPersonById = (personId: string) => {
    const person = ALL_PEOPLE.find((p) => p.id === personId);
    if (person) addPerson(person);
  };

  const assignTask = (task: AssignedTask) => push({ role: "ai", kind: "task", task });

  // Save an edited playbook document back into its message, and note the
  // revision in the thread so anyone joining later can see it changed.
  const updatePanel = (messageId: number, panel: PlaybookPanel) => {
    setMessages((m) => m.map((msg) => (msg.id === messageId ? { ...msg, panel } : msg)));
    const title = panel.kind === "recap" && panel.doc ? panel.doc.docType : "Document";
    push({ role: "ai", kind: "event", text: `${title} edited by you` });
  };

  // People the assistant has suggested bringing in who aren't in yet.
  const suggestedPeople = messages
    .map((m) => (m.kind === "suggest-person" ? ALL_PEOPLE.find((p) => p.id === m.suggestion?.personId) : undefined))
    .filter((p): p is Person => !!p && !participants.some((x) => x.id === p.id));

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
    // The data the alert was raised from, so the summary can be checked.
    if (pb.evidence?.length) {
      timers.current.push(
        setTimeout(
          () =>
            push({
              role: "ai",
              kind: "text",
              text: [
                "Supporting data",
                ...pb.evidence!.map((m) => `• ${m.label ? `${m.label}: ` : ""}${m.value}`),
              ].join("\n"),
            }),
          1400
        )
      );
    }
    timers.current.push(
      setTimeout(() => {
        setTyping(false);
        const recommendation: Omit<ChatMsg, "id"> = {
          role: "ai",
          kind: "text",
          text: `Recommended by HMAX - ${pb.recommendation}`,
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
        if (pb.suggestedPerson) push({ role: "ai", kind: "suggest-person", suggestion: pb.suggestedPerson });
      }, pb.evidence?.length ? 2400 : 1900)
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
        (restore.participantIds ?? []).map((id) => ALL_PEOPLE.find((p) => p.id === id)).filter((p): p is Person => !!p)
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
    if (t) send(t);
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
            "✓ Lead created and added to your pipeline.\n\nDuke Energy - Fleet reliability program is now in Discovery (€5.4M, Premium). Next steps: qualify the budget and capture the account & shipping details to move it toward Scoping.",
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

  return (
    <div
      className={`fixed inset-0 p-6 z-50 flex transition-opacity duration-[340ms] ease-[var(--ease-standard)] ${
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      style={{
        background: "#f5f5f5",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
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
          className="absolute top-6 right-6 z-20 size-8 rounded-full flex items-center justify-center text-gray-900 hover:bg-black/5 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      )}

      {/* Left - customer context. For widget-launched chats it stays hidden
          until the conversation is tied to a specific customer. */}
      <div
        className={`relative z-10 rounded-2xl shrink-0 overflow-hidden transition-[width,margin] duration-[340ms] ease-[var(--ease-standard)] ${
          showPanel ? "w-[372px] mr-6" : "w-0"
        }`}
      >
        <div
          className={`w-[372px] h-full transition-transform duration-[340ms] ease-[var(--ease-standard)] ${
            showPanel ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Whatever the conversation is about, the pane shows that record's
              own detail content. With no record pinned, a customer mentioned
              in the thread is enough to pin their estate. */}
          {activeEntity ? (
            <EntityContextPanel entity={activeEntity} onAction={(t) => send(t)} />
          ) : detectedCustomer ? (
            <EntityContextPanel entity={{ kind: "customer", name: detectedCustomer }} onAction={(t) => send(t)} />
          ) : null}
        </div>
      </div>

      {/* Right - welcome → conversation (prompt box is the fixed anchor) */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col">
        {/* Header - floats over the thread, which blurs and fades out beneath it */}
        {started && (
          <div className="absolute -top-6 -inset-x-6 z-20 p-6">
            <ProgressiveBlur />
            <div className="absolute inset-0 bg-gradient-to-b from-[#f5f5f5] to-[#f5f5f5]/0 pointer-events-none" />
            <div className="relative flex items-center gap-4">
              <h2 className="flex-1 min-w-0 text-xl leading-7 text-gray-950 truncate">
                {activeContext ?? messages.find((m) => m.role === "user")?.text ?? "New conversation"}
              </h2>
              <ConversationPeople
                participants={participants}
                suggested={suggestedPeople}
                onAdd={addPerson}
                onRemove={removePerson}
                onAssign={assignTask}
              />
              <button
                onClick={onClose}
                aria-label="Close conversation"
                className="size-8 rounded-full flex items-center justify-center text-gray-950 hover:bg-black/5 transition-colors cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Content area above the prompt */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth flex flex-col">
          <div className={`mx-auto w-full ${started ? "max-w-[600px] pt-14 pb-32" : "max-w-[632px] px-4 flex-1 flex flex-col items-center justify-center"}`}>
            {!started ? (
              /* Welcome - title, the prompt, then four starting points */
              <div className="w-full flex flex-col items-center gap-16 animate-rise-in">
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-4xl font-bold text-gray-950">Create A New Conversation</h1>
                  <p className="text-xl text-gray-500">Need Help? Ask Me Anything!</p>
                </div>

                <div className="w-full flex flex-col gap-6">
                  <PromptBar value={input} onChange={setInput} onSend={handleSend} className="shadow-xl" />

                  <div className="grid grid-cols-2 gap-4">
                    {welcome.suggestions.map(({ icon: Icon, title, sub, prompt }) => (
                      <button
                        key={title}
                        onClick={() => send(prompt ?? title)}
                        className="min-h-[100px] bg-[#222222]/5 hover:bg-[#222222]/10 rounded-xl p-6 flex items-center gap-4 text-left transition-colors cursor-pointer"
                      >
                        <Icon size={24} className="text-gray-950 shrink-0" />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-bold text-gray-950">{title}</span>
                          <span className="block text-xs text-gray-500">{sub}</span>
                        </span>
                      </button>
                    ))}
                  </div>
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
                onUpdatePanel={updatePanel}
                participantIds={participants.map((p) => p.id)}
                onAddPerson={addPersonById}
              />
            )}
          </div>
        </div>

        {/* Prompt - once a conversation starts it floats at the foot of the thread */}
        {started && (
          <div className="absolute bottom-0 inset-x-0 z-20 flex justify-center pointer-events-none">
            <PromptBar
              value={input}
              onChange={setInput}
              onSend={handleSend}
              className="w-full max-w-[600px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] pointer-events-auto"
            />
          </div>
        )}
      </div>

      {/* Document panel - pushes in from the right, mirroring the context panel */}
      <div
        className={`relative z-10 shrink-0 overflow-hidden transition-[width] duration-[340ms] ease-[var(--ease-standard)] ${
          docVisible ? "w-[460px]" : "w-0"
        }`}
      >
        <div
          className={`w-[460px] h-full transition-transform duration-[340ms] ease-[var(--ease-standard)] ${
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
