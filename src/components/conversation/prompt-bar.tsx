"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mic, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ── Speech recognition ──────────────────────────────────────────────
   The Web Speech API isn't in TypeScript's DOM lib, and Chrome/Safari only
   expose it prefixed - so it's typed loosely here. */
/* eslint-disable @typescript-eslint/no-explicit-any */
type Recognition = any;

function recognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const noopSubscribe = () => () => {};

/* ── Prompt bar ──────────────────────────────────────────────────── */
interface Props {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  /** Extra classes for the outer pill (e.g. its shadow). */
  className?: string;
}

/** The message pill: text input with a voice button inside it, then send.
 *  Speaking dictates into the input so the prompt can be checked or edited
 *  before it's sent. */
export default function PromptBar({ value, onChange, onSend, className = "" }: Props) {
  // Only offer the mic where the browser can actually transcribe.
  const supported = useSyncExternalStore(noopSubscribe, () => !!recognitionCtor(), () => false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recognition>(null);
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Stop listening if the bar goes away mid-dictation.
  useEffect(() => () => recRef.current?.abort(), []);

  const stop = () => recRef.current?.stop();

  const start = () => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = navigator.language || "en-US";
    rec.continuous = true;
    rec.interimResults = true;

    // Dictation adds to whatever is already typed.
    const base = valueRef.current.trim();
    rec.onresult = (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
      const spoken = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("")
        .trim();
      onChange(base && spoken ? `${base} ${spoken}` : base || spoken);
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
    };
    rec.onerror = () => setListening(false);

    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  const send = () => {
    stop();
    onSend();
  };

  return (
    <div className={`bg-white rounded-full p-4 flex items-center gap-2.5 ${className}`}>
      <div className="relative flex-1 min-w-0">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={listening ? "Listening..." : "Your Message"}
          aria-label="Your message"
          className={`w-full h-12 pl-2.5 ${supported ? "pr-12" : "pr-2.5"} text-sm text-gray-700 placeholder-gray-500 bg-white border rounded-full outline-none transition-colors ${
            listening ? "border-status-critical/50" : "border-gray-200 focus:border-gray-400"
          }`}
          autoFocus
        />
        {supported && (
          <button
            type="button"
            onClick={listening ? stop : start}
            aria-label={listening ? "Stop voice input" : "Speak your message"}
            aria-pressed={listening}
            title={listening ? "Stop listening" : "Speak your message"}
            className={`absolute right-1.5 top-1/2 -translate-y-1/2 size-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              listening ? "bg-status-critical text-white" : "text-gray-500 hover:text-gray-900 hover:bg-black/5"
            }`}
          >
            {listening && <span className="absolute inset-0 rounded-full bg-status-critical/40 animate-ping" />}
            <Mic size={16} className="relative" />
          </button>
        )}
      </div>
      <Button onClick={send} aria-label="Send" className="rounded-full size-12 p-0 shrink-0 cursor-pointer">
        <Send size={16} />
      </Button>
    </div>
  );
}
