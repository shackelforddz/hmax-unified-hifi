"use client";

import { useEffect, useRef, useState } from "react";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConversationLauncher } from "./conversation-launcher";
import type { WidgetAlertCopy } from "@/lib/widget-attention";

/** A widget whose own measure has breached carries this beside its chat
 *  trigger. Clicking it explains what breached and by how much - the number
 *  on the widget says something is wrong, this says what. */
export default function WidgetAlert({ title, detail, widget, action }: WidgetAlertCopy) {
  const launch = useConversationLauncher();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Needs attention: ${title}`}
        className="size-8 rounded-full bg-status-critical/10 hover:bg-status-critical/20 flex items-center justify-center text-status-critical transition-colors cursor-pointer"
      >
        <CircleAlert size={16} strokeWidth={2} />
      </button>

      {open && (
        <div
          role="alert"
          className="absolute right-0 top-full mt-2 z-40 w-[264px] rounded-xl border border-status-critical/40 bg-red-50 p-3 shadow-xl animate-message-in"
        >
          <p className="flex items-center gap-1.5 text-xs font-bold text-status-critical">
            <CircleAlert size={13} strokeWidth={2} className="shrink-0" />
            {title}
          </p>
          <p className="text-xs text-gray-700 leading-4 mt-1.5">{detail}</p>

          {/* What to do about it */}
          <div className="mt-3 pt-3 border-t border-status-critical/20">
            <p className="text-[11px] text-gray-400 tracking-wider mb-2">Recommended by HMAX</p>
            <Button
              onClick={() => {
                setOpen(false);
                launch({ context: widget, prompt: action.prompt });
              }}
              className="rounded-full px-4 cursor-pointer"
            >
              {action.label}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** The wash that sits in the top-right corner of a widget needing attention.
 *  The blur is baked into the asset; the inner box is the bleed the blur needs,
 *  which is why it is inset past the edges. Clipped by the widget's own card. */
export function WidgetAttentionGlow() {
  return (
    <span aria-hidden className="pointer-events-none absolute h-[115px] w-[218px] right-[-16px] top-[-8px]">
      <span className="absolute inset-[-34.78%_-18.35%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/widget-attention-glow.svg" alt="" className="block max-w-none size-full" />
      </span>
    </span>
  );
}
