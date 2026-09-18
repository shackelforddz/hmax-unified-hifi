"use client";

/* A side-by-side of the four AI treatments against real recommendation
   content. Pick one, set AI_VARIANT in ai-surface.tsx, and this page can go. */

import AiSurface, { AI_VARIANTS, AiLabel, aiText, type AiVariant } from "@/components/dashboard/ai-surface";
import { Button } from "@/components/ui/button";

const TOP_USED = [
  { name: "Contracts that need your attention", n: 48 },
  { name: "Delivery map", n: 35 },
  { name: "Waiting on", n: 31 },
];

function LayoutCard({ variant }: { variant: AiVariant }) {
  const t = aiText(variant);
  return (
    <AiSurface variant={variant} bodyClassName="p-4 flex flex-col gap-2 h-full">
      <AiLabel variant={variant} />
      <p className={`text-sm font-bold ${t.title}`}>A layout built around what you use most</p>
      <p className={`text-xs leading-4 ${t.body}`}>
        Widgets are ordered by how much you&apos;ve used them over the last 30 days and resized so every row fills.
        Contracts that need your attention, Delivery map, Waiting on lead the dashboard.
      </p>
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {TOP_USED.map((u) => (
          <span key={u.name} className={`text-[11px] rounded-full px-2 py-0.5 ${t.chip}`}>
            {u.name} · {u.n} interactions
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2 pt-2 mt-auto">
        <Button size="sm" className={`rounded-full cursor-pointer ${t.primary}`}>Preview layout</Button>
        <Button variant="ghost" size="sm" className={`rounded-full cursor-pointer ${t.ghost}`}>
          Dismiss
        </Button>
      </div>
    </AiSurface>
  );
}

function WidgetCard({ variant }: { variant: AiVariant }) {
  const t = aiText(variant);
  return (
    <AiSurface variant={variant} bodyClassName="p-4 grid grid-cols-2 gap-4 h-full">
      <span className={`rounded-lg border ${variant === "glass" ? "border-white/15 bg-white/5" : "border-gray-100 bg-white/70"} h-[140px]`} />
      <div className="flex flex-col gap-2 min-w-0">
        <AiLabel variant={variant} />
        <p className={`text-sm font-bold leading-5 ${t.title}`}>Resource &amp; Capacity</p>
        <p className={`text-xs leading-4 ${t.body}`}>
          Field Service is at 96% utilisation, and crew availability is behind two of your slipping deliveries.
        </p>
        <div className="flex items-center gap-2 pt-1 mt-auto">
          <Button size="sm" className={`rounded-full cursor-pointer ${t.primary}`}>Add to dashboard</Button>
          <Button variant="ghost" size="sm" className={`rounded-full cursor-pointer ${t.ghost}`}>
            Dismiss
          </Button>
        </div>
      </div>
    </AiSurface>
  );
}

export default function AiStylesPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] p-8">
      <div className="mx-auto max-w-[1100px] flex flex-col gap-10">
        <div>
          <h1 className="text-2xl text-gray-900">HMAX recommendation surfaces</h1>
          <p className="text-sm text-gray-500 mt-1">
            The layout and widget recommendations in four treatments, on the dashboard&apos;s own background.
          </p>
        </div>

        {AI_VARIANTS.map((v) => (
          <section key={v.value} className="flex flex-col gap-3">
            <div className="flex items-baseline gap-3">
              <h2 className="text-base font-bold text-gray-900">{v.name}</h2>
              <p className="text-xs text-gray-500">{v.note}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 items-stretch">
              <LayoutCard variant={v.value} />
              <WidgetCard variant={v.value} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
