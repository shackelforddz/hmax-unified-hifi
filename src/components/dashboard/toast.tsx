"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";

/* ── Toasts ──────────────────────────────────────────────────────────
   For the handful of actions that move something out of view: the toast
   says what happened and where the thing went, so the user doesn't have to
   go looking for it. */

interface Toast {
  id: number;
  title: string;
  /** Where it went, and anything else worth knowing. */
  detail?: string;
}

const ToastContext = createContext<(t: Omit<Toast, "id">) => void>(() => {});

const LIFETIME = 6000;
const noopSubscribe = () => () => {};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  // Portals need document.body, which only exists on the client.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);

  const show = useCallback((t: Omit<Toast, "id">) => {
    const id = ++idRef.current;
    setToasts((ts) => [...ts, { ...t, id }]);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] flex flex-col items-center gap-2">
            {toasts.map((t) => (
              <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, LIFETIME);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="status"
      className="flex items-start gap-3 w-[min(92vw,420px)] bg-white rounded-xl border border-gray-200 shadow-xl px-4 py-3 animate-message-in"
    >
      <span className="mt-0.5 size-5 rounded-full bg-status-ok/10 flex items-center justify-center shrink-0">
        <Check size={12} strokeWidth={2.5} className="text-status-ok" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-gray-900">{toast.title}</p>
        {toast.detail && <p className="text-xs text-gray-500 leading-4 mt-0.5">{toast.detail}</p>}
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="-mt-1 -mr-1 w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
      >
        <X size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}

export const useToast = () => useContext(ToastContext);
