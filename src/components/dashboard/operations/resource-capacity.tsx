import WidgetChat from "@/components/dashboard/widget-chat";
import WidgetAlert, { WidgetAttentionGlow } from "@/components/dashboard/widget-alert";
import { ATTENTION_DETAIL, NEEDS_ATTENTION } from "@/lib/widget-attention";
import { TEAMS, type Team } from "@/lib/operations-data";
import BarFill from "@/components/dashboard/bar-fill";
import { useCountUp } from "@/lib/motion";

/* One team's allocation. Its own component so it can hold the hook that counts
   the utilisation figure in step with the bar filling underneath it. */
function TeamRow({ t }: { t: Team }) {
  const over = t.utilization >= 95;
  const pct = `${t.utilization}%`;
  const label = useCountUp<HTMLSpanElement>(pct);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-700">{t.name}</span>
        <span className="text-sm text-gray-500">
          {t.allocated}/{t.headcount} allocated ·{" "}
          <span ref={label} className={over ? "text-gray-900 font-medium" : "text-gray-500"}>
            {pct}
          </span>
        </span>
      </div>
      <BarFill
        pct={t.utilization}
        className="h-2 bg-gray-100"
        fillClassName={over ? "bg-status-critical" : "bg-chart-line"}
      />
    </div>
  );
}

export default function ResourceCapacity() {
  return (
    <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-base text-gray-900">Resource &amp; Capacity</h3>
        <div className="flex items-center gap-2 shrink-0">
  <WidgetChat title="Resource & Capacity" />
          {NEEDS_ATTENTION.resourceCapacity && <WidgetAlert {...ATTENTION_DETAIL.resourceCapacity} />}
        </div>
      </div>

      {/* Teams */}
      <div className="flex flex-col gap-3.5">
        {TEAMS.map((t) => (
          <TeamRow key={t.name} t={t} />
        ))}
      </div>

      {NEEDS_ATTENTION.resourceCapacity && <WidgetAttentionGlow />}
    </div>
  );
}
