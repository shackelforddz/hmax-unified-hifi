"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { UserRoundPlus, Search, X, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ALL_PEOPLE, type Person } from "@/lib/people-data";
import { type AssignedTask } from "./chat-panel";

/* ── Assign a task ───────────────────────────────────────────────── */
function isoInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function AssignTaskDialog({
  people,
  initial,
  onAssign,
  onClose,
}: {
  people: Person[];
  initial: Person;
  onAssign: (task: AssignedTask) => void;
  onClose: () => void;
}) {
  const [assigneeId, setAssigneeId] = useState(initial.id);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [due, setDue] = useState(() => isoInDays(7));

  const assignee = people.find((p) => p.id === assigneeId) ?? initial;
  const canSubmit = title.trim().length > 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = () => {
    if (!canSubmit) return;
    onAssign({
      assigneeId: assignee.id,
      assignee: assignee.name,
      role: assignee.role,
      avatar: assignee.avatar,
      title: title.trim(),
      due,
      note: note.trim() || undefined,
    });
    onClose();
  };

  const field = "w-full px-3 py-2 text-sm text-gray-700 placeholder-gray-300 border border-gray-200 rounded-full outline-none focus:border-gray-400";
  // Multi-line boxes keep a soft corner - a pill shape crops the text.
  const fieldBox = field.replace("rounded-full", "rounded-xl");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-gray-100 p-5 animate-message-in">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-base text-gray-900">Assign a task</p>
            <p className="text-xs text-gray-400 mt-0.5">
              They&apos;ll be notified with this conversation as context.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-black/5 transition-colors cursor-pointer shrink-0"
          >
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        <label className="block text-xs text-gray-400 mb-1.5">Assignee</label>
        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className={`${field} mb-3 cursor-pointer`}
        >
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.role}
            </option>
          ))}
        </select>

        <label className="block text-xs text-gray-400 mb-1.5">Task</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoFocus
          placeholder="e.g. Confirm the thermal headroom against the nameplate"
          className={`${field} mb-3`}
        />

        <label className="block text-xs text-gray-400 mb-1.5">Due</label>
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={`${field} mb-3 cursor-pointer`} />

        <label className="block text-xs text-gray-400 mb-1.5">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything they need to know before they start"
          className={`${fieldBox} h-16 resize-none mb-4`}
        />

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-full h-auto px-4 py-2 text-sm text-gray-700 cursor-pointer">
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit} className="rounded-full h-auto px-4 py-2 text-sm cursor-pointer">
            <ClipboardCheck size={14} strokeWidth={1.5} />
            Assign task
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Participants + add-people popover ───────────────────────────── */
interface Props {
  participants: Person[];
  /** People the assistant recommends adding - listed first. */
  suggested?: Person[];
  onAdd: (person: Person) => void;
  onRemove: (person: Person) => void;
  onAssign: (task: AssignedTask) => void;
}

export default function ConversationPeople({ participants, suggested = [], onAdd, onRemove, onAssign }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [assignFor, setAssignFor] = useState<Person | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const inConversation = useMemo(() => new Set(participants.map((p) => p.id)), [participants]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const suggestedIds = new Set(suggested.map((p) => p.id));
    return ALL_PEOPLE.filter(
      (p) =>
        !inConversation.has(p.id) &&
        (!q || p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q))
    ).sort((a, b) => Number(suggestedIds.has(b.id)) - Number(suggestedIds.has(a.id)));
  }, [query, inConversation, suggested]);
  const isSuggested = (p: Person) => suggested.some((s) => s.id === p.id);

  return (
    <>
      {/* Avatar stack - who is already in */}
      {participants.length > 0 && (
        <div className="flex items-center -space-x-2 mr-1 shrink-0">
          {participants.slice(0, 3).map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p.id}
              src={p.avatar}
              alt={p.name}
              title={`${p.name} · ${p.role}`}
              className="w-7 h-7 rounded-full object-cover bg-gray-200 ring-2 ring-white"
            />
          ))}
          {participants.length > 3 && (
            <span className="w-7 h-7 rounded-full bg-gray-200 ring-2 ring-white flex items-center justify-center text-[10px] text-gray-600">
              +{participants.length - 3}
            </span>
          )}
        </div>
      )}

      <div ref={wrapRef} className="relative shrink-0">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Add people to this conversation"
          aria-expanded={open}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-black/5 transition-colors cursor-pointer"
        >
          <UserRoundPlus size={17} strokeWidth={1.5} />
        </button>

        {open && (
          <div className="absolute right-0 top-11 z-50 w-[320px] bg-white rounded-xl shadow-xl border border-gray-100 animate-message-in overflow-hidden">
            {/* Already in the conversation */}
            {participants.length > 0 && (
              <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                <p className="text-[11px] text-gray-400 tracking-wider mb-2">In this conversation</p>
                <div className="flex flex-col gap-1">
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.avatar} alt="" aria-hidden className="w-7 h-7 rounded-full object-cover bg-gray-200 shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-gray-800 truncate">{p.name}</span>
                        <span className="block text-xs text-gray-400 truncate">{p.role}</span>
                      </span>
                      <button
                        onClick={() => {
                          setAssignFor(p);
                          setOpen(false);
                        }}
                        className="shrink-0 text-xs text-gray-600 border border-gray-200 rounded-full px-2.5 py-1 hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Assign task
                      </button>
                      <button
                        onClick={() => onRemove(p)}
                        aria-label={`Remove ${p.name}`}
                        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-black/5 transition-colors cursor-pointer"
                      >
                        <X size={13} strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add someone */}
            <div className="px-4 pt-4 pb-2">
              <p className="text-sm text-gray-900 mb-0.5">Add a coworker</p>
              <p className="text-xs text-gray-400 mb-3">
                They get the thread and its context, and you can hand them a task.
              </p>
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2.5 py-1.5 focus-within:border-gray-400">
                <Search size={14} strokeWidth={1.5} className="text-gray-400 shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  placeholder="Search by name or role"
                  className="flex-1 min-w-0 text-sm text-gray-700 placeholder-gray-300 outline-none bg-transparent"
                />
              </div>
            </div>

            <div className="max-h-[240px] overflow-y-auto no-scrollbar px-2 pb-3">
              {results.length > 0 ? (
                results.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onAdd(p);
                      setQuery("");
                    }}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-left"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.avatar} alt="" aria-hidden className="w-7 h-7 rounded-full object-cover bg-gray-200 shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-gray-800 truncate">{p.name}</span>
                      <span className="block text-xs text-gray-400 truncate">
                        {p.role} · {p.allocation}% allocated
                      </span>
                    </span>
                    {isSuggested(p) && (
                      <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-gray-900 text-white">Suggested</span>
                    )}
                    <span className="shrink-0 text-xs text-gray-400">Add</span>
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-5">
                  {query ? "No one matches that search." : "Everyone is already in this conversation."}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {assignFor && (
        <AssignTaskDialog
          people={participants}
          initial={assignFor}
          onAssign={onAssign}
          onClose={() => setAssignFor(null)}
        />
      )}
    </>
  );
}
