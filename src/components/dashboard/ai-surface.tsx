"use client";

import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

/* ── HMAX's own surface ───────────────────────────────────────────────
   A recommendation is the one thing on the dashboard the product itself
   authored, so it gets a surface nothing else uses: a slow aurora in the
   AI palette behind a card that is otherwise the same shape as its
   neighbours. Four treatments, so the look can be chosen against real
   content rather than described. */

export type AiVariant = "aurora" | "glass" | "outline" | "mesh";

/** The treatment in use across the product. Change this one line to switch. */
export const AI_VARIANT: AiVariant = "aurora";

export const AI_VARIANTS: { value: AiVariant; name: string; note: string }[] = [
  { value: "aurora", name: "Aurora", note: "White card, colour drifting slowly behind it. Quietest against the dashboard." },
  { value: "glass", name: "Glass", note: "Dark translucent panel over the aurora, with light passing across it." },
  { value: "outline", name: "Outline", note: "A gradient hairline and one corner glow. The most restrained of the four." },
  { value: "mesh", name: "Mesh", note: "The whole field is the gradient, the way an insight card reads." },
];

/** Film grain, so a large flat gradient doesn't band. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

function Grain({ opacity = 0.18 }: { opacity?: number }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 mix-blend-overlay"
      style={{ backgroundImage: GRAIN, opacity }}
    />
  );
}

/** Three slow blobs - the light behind every variant but Mesh. */
function Aurora({ dim = false }: { dim?: boolean }) {
  return (
    <span aria-hidden className={`pointer-events-none absolute inset-0 ${dim ? "opacity-70" : ""}`}>
      <span className="absolute -top-16 -left-10 size-56 rounded-full bg-ai-violet/40 blur-3xl animate-ai-drift-a" />
      <span className="absolute -bottom-20 left-1/3 size-56 rounded-full bg-ai-blue/35 blur-3xl animate-ai-drift-b" />
      <span className="absolute -top-10 -right-12 size-52 rounded-full bg-ai-cyan/35 blur-3xl animate-ai-drift-c" />
    </span>
  );
}

/* The mesh field, as a stack of radial gradients rather than an image. */
const MESH: React.CSSProperties = {
  backgroundImage: [
    "radial-gradient(60% 80% at 8% 12%, color-mix(in oklab, var(--color-ai-violet) 26%, transparent) 0%, transparent 60%)",
    "radial-gradient(55% 75% at 92% 8%, color-mix(in oklab, var(--color-ai-cyan) 30%, transparent) 0%, transparent 62%)",
    "radial-gradient(70% 90% at 50% 110%, color-mix(in oklab, var(--color-ai-blue) 28%, transparent) 0%, transparent 65%)",
    "linear-gradient(180deg, #ffffff 0%, #fdfdff 100%)",
  ].join(", "),
};

/** The card a recommendation sits on. */
export default function AiSurface({
  variant = AI_VARIANT,
  className = "",
  bodyClassName = "",
  children,
}: {
  variant?: AiVariant;
  className?: string;
  /** Padding and layout for the content, inside the surface's own effects. */
  bodyClassName?: string;
  children: ReactNode;
}) {
  if (variant === "outline") {
    return (
      <div className={`rounded-xl bg-gradient-to-br from-ai-violet/50 via-ai-blue/40 to-ai-cyan/50 p-px ${className}`}>
        <div className="relative h-full rounded-[11px] bg-white overflow-hidden">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-14 -right-10 size-44 rounded-full bg-ai-blue/20 blur-3xl animate-ai-drift-c"
          />
          <div className={`relative ${bodyClassName}`}>{children}</div>
        </div>
      </div>
    );
  }

  if (variant === "glass") {
    return (
      <div className={`relative rounded-xl overflow-hidden bg-gray-950 ${className}`}>
        <Aurora dim />
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-gray-950/55" />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-12 bg-white/10 blur-md animate-ai-sheen"
        />
        <Grain opacity={0.22} />
        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-xl border border-white/15" />
        <div className={`relative text-white ${bodyClassName}`}>{children}</div>
      </div>
    );
  }

  if (variant === "mesh") {
    return (
      <div className={`relative rounded-xl overflow-hidden border border-ai-blue/15 ${className}`} style={MESH}>
        <Grain opacity={0.12} />
        <div className={`relative ${bodyClassName}`}>{children}</div>
      </div>
    );
  }

  // aurora
  return (
    <div className={`relative rounded-xl overflow-hidden border border-gray-200 bg-white ${className}`}>
      <Aurora />
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-white/55" />
      <Grain opacity={0.14} />
      <div className={`relative ${bodyClassName}`}>{children}</div>
    </div>
  );
}

/** The mark that says this came from HMAX rather than from the data. */
export function AiLabel({ variant = AI_VARIANT, children = "Recommended by HMAX" }: { variant?: AiVariant; children?: ReactNode }) {
  const dark = variant === "glass";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex items-center justify-center">
        <Sparkles
          size={13}
          strokeWidth={2}
          className={dark ? "text-ai-cyan" : "text-ai-violet"}
        />
      </span>
      <span
        className={`text-[11px] font-bold tracking-wider ${
          dark
            ? "text-white/80"
            : "bg-gradient-to-r from-ai-violet via-ai-blue to-ai-cyan bg-clip-text text-transparent"
        }`}
      >
        {children}
      </span>
      <span
        aria-hidden
        className={`size-1.5 rounded-full animate-ai-pulse ${dark ? "bg-ai-cyan" : "bg-ai-blue"}`}
      />
    </span>
  );
}

/** Body text that stays legible on whichever surface it lands on. */
export const aiText = (variant: AiVariant = AI_VARIANT) => ({
  title: variant === "glass" ? "text-white" : "text-gray-900",
  body: variant === "glass" ? "text-white/65" : "text-gray-500",
  chip:
    variant === "glass"
      ? "bg-white/10 text-white/80 border border-white/15"
      : "bg-white/70 text-gray-600 border border-gray-200",
  /* The primary action has to invert on the dark surface to stay visible. */
  primary: variant === "glass" ? "bg-white text-gray-900 hover:bg-white/85" : "",
  ghost: variant === "glass" ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-gray-500",
});
