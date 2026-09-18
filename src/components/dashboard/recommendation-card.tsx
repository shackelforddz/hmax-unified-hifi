import type { ReactNode } from "react";

/* ── The recommendation card ─────────────────────────────────────────
   Anything HMAX suggests sits on the same tinted panel: a warm gradient
   with a blue hue laid over it, so a recommendation reads as its own
   surface rather than another white card. */

/** The tint, as two blended layers - the same pair the design uses. */
function Tint() {
  return (
    <div aria-hidden className="absolute inset-0 rounded-xl pointer-events-none">
      <div
        className="absolute inset-0 rounded-xl"
        style={{ backgroundImage: "linear-gradient(-61.93deg, rgb(233, 251, 197) 0%, rgb(248, 250, 240) 99.63%)" }}
      />
      <div className="absolute inset-0 rounded-xl bg-[#3b82f6] mix-blend-hue" />
    </div>
  );
}

export function RecommendationCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative isolate flex-1 min-w-0 rounded-xl p-6 ${className}`}>
      <Tint />
      <div className="relative flex h-full flex-col gap-4">{children}</div>
    </div>
  );
}

/** Who is suggesting it, then what is being suggested. */
export function RecommendationHead({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col">
        <p className="text-xs text-gray-500">Recommended by HMAX</p>
        <p className="text-sm font-bold text-gray-900">{title}</p>
      </div>
      <p className="text-sm text-gray-900 leading-5">{children}</p>
    </div>
  );
}

/** A piece of the evidence behind a recommendation. */
export function RecommendationTag({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs font-bold text-gray-900 border border-gray-200 rounded-full px-2 py-0.5">{children}</span>
  );
}

/** The card's actions - one to take it, one to dismiss it. */
export function RecommendationActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-3 mt-auto">{children}</div>;
}
