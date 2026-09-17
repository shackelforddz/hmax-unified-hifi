"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { MessageCircle } from "lucide-react";
import { useConversationLauncher } from "./conversation-launcher";
import { Button } from "@/components/ui/button";
import { widgetStarters } from "@/lib/knowledge-base";

interface Props {
  /** The widget name used as conversation context. */
  title: string;
  /** Optional trigger button styling (e.g. floating on the map). */
  triggerClassName?: string;
}

const POPOVER_W = 300;

export default function WidgetChat({ title, triggerClassName }: Props) {
  const launch = useConversationLauncher();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.max(12, Math.min(r.right - POPOVER_W, window.innerWidth - POPOVER_W - 12));
    setPos({ top: r.bottom + 8, left });
  };

  const toggle = () => {
    if (!open) place();
    setOpen((o) => !o);
  };

  // Close on outside click, scroll, or Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        popRef.current && !popRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    // Close when the page scrolls (the fixed popover would detach), but ignore
    // scrolling that happens inside the popover itself (e.g. the chips row).
    const onScroll = (e: Event) => {
      if (popRef.current && e.target instanceof Node && popRef.current.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Starter prompts tailored to the widget's topic.
  const starters = useMemo(() => widgetStarters(title), [title]);

  const startWith = (prompt: string) => {
    launch({ context: title, prompt });
    setOpen(false);
    setText("");
  };

  const submit = () => startWith(text.trim() || `Tell me about ${title}`);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className={triggerClassName ?? "text-gray-300 hover:text-gray-500 transition-colors cursor-pointer shrink-0"}
        aria-label={`Chat about ${title}`}
      >
        <MessageCircle size={16} strokeWidth={1.5} />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popRef}
            style={{ position: "fixed", top: pos.top, left: pos.left, width: POPOVER_W }}
            className="z-[60] bg-white rounded-xl shadow-xl border border-gray-100 p-4 animate-message-in"
          >
            <p className="text-sm text-gray-900 mb-0.5">Ask about {title}</p>
            <p className="text-xs text-gray-400 mb-3">
              Start a conversation with this widget&apos;s data as context.
            </p>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKey}
              autoFocus
              placeholder={`e.g. What's driving ${title.toLowerCase()}?`}
              className="w-full h-20 px-3 py-2 text-sm text-gray-700 placeholder-gray-300 border border-gray-200 rounded-xl outline-none focus:border-gray-400 resize-none"
            />

            {starters.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] text-gray-400 tracking-wider mb-1.5">Suggested</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
                  {starters.map((p) => (
                    <button
                      key={p}
                      onClick={() => startWith(p)}
                      className="shrink-0 whitespace-nowrap text-xs text-gray-600 border border-gray-200 rounded-full px-3 py-1.5 hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={submit} className="w-full mt-3 rounded-full h-auto py-2 text-sm cursor-pointer">
              Start conversation
            </Button>
          </div>,
          document.body
        )}
    </>
  );
}
