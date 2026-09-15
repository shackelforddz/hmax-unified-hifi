"use client";

import { ArrowUp } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import WidgetChat from "@/components/dashboard/widget-chat";
import { OPPORTUNITIES, type OppStage } from "@/lib/sales-data";

const parseVal = (v: string) => parseFloat(v.replace(/[^0-9.]/g, "")) || 0; // "$8.2M" → 8.2
const fmt = (n: number) => `$${n.toFixed(1)}M`;

// Win probability by stage - drives the weighted forecast.
const STAGE_PROB: Record<OppStage, number> = {
  Prospects: 0.2,
  Bidding: 0.6,
  Negotiation: 0.9,
};
const OFFER_PLUS: OppStage[] = ["Bidding", "Negotiation"];

// Illustrative pipeline-value trend (ends at the current total).
const SPARK = [22.1, 23.4, 24.0, 25.2, 24.6, 26.5, 27.3].map((v) => ({ v }));

export default function OpportunityStats() {
  const total = OPPORTUNITIES.reduce((s, o) => s + parseVal(o.value), 0);
  const weighted = OPPORTUNITIES.reduce((s, o) => s + parseVal(o.value) * (STAGE_PROB[o.stage] ?? 0), 0);
  const offerPlus = OPPORTUNITIES.filter((o) => OFFER_PLUS.includes(o.stage));
  const offerPlusValue = offerPlus.reduce((s, o) => s + parseVal(o.value), 0);

  const weightedPct = Math.round((weighted / total) * 100);
  const offerPct = Math.round((offerPlus.length / OPPORTUNITIES.length) * 100);
  const spark = [...SPARK, { v: total }];
  const delta = total - SPARK[SPARK.length - 1].v;

  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Pipeline value - wide tile with a trend sparkline */}
      <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
        <div className="flex items-start justify-between mb-1">
          <p className="text-base text-gray-900">Pipeline value</p>
          <WidgetChat title="Pipeline value" />
        </div>
        <div className="flex items-end justify-between gap-4 flex-1">
          <div>
            <p className="text-4xl text-gray-900 leading-none">{fmt(total)}</p>
            <p className="flex items-center gap-1 text-xs text-gray-500 mt-2">
              <ArrowUp size={12} strokeWidth={2} /> {fmt(delta)} vs last month
              <span className="text-gray-400">· {OPPORTUNITIES.length} leads</span>
            </p>
          </div>
          <div className="w-40 h-14 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="pipelineSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#171717" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#171717" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#171717" strokeWidth={2} fill="url(#pipelineSpark)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weighted forecast */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
        <div className="flex items-start justify-between mb-1">
          <p className="text-base text-gray-900">Weighted forecast</p>
          <WidgetChat title="Weighted forecast" />
        </div>
        <div className="flex-1 flex flex-col justify-end">
          <p className="text-4xl text-gray-900 leading-none">{fmt(weighted)}</p>
          <p className="text-xs text-gray-500 mt-2 mb-2">{weightedPct}% of pipeline · probability-weighted</p>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gray-900 rounded-full" style={{ width: `${weightedPct}%` }} />
          </div>
        </div>
      </div>

      {/* Contracts at offer stage or beyond */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
        <div className="flex items-start justify-between mb-1">
          <p className="text-base text-gray-900">At offer stage or beyond</p>
          <WidgetChat title="Contracts at offer stage" />
        </div>
        <div className="flex-1 flex flex-col justify-end">
          <p className="text-4xl text-gray-900 leading-none">{offerPlus.length}</p>
          <p className="text-xs text-gray-500 mt-2 mb-2">of {OPPORTUNITIES.length} leads · {fmt(offerPlusValue)}</p>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gray-900 rounded-full" style={{ width: `${offerPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
