import WidgetChat from "@/components/dashboard/widget-chat";
import { TEAMS } from "@/lib/operations-data";

export default function ResourceCapacity() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-base text-gray-900">Resource &amp; Capacity</h3>
        <WidgetChat title="Resource & Capacity" />
      </div>

      {/* Teams */}
      <div className="flex flex-col gap-3.5">
        {TEAMS.map((t) => {
          const over = t.utilization >= 95;
          return (
            <div key={t.name}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-gray-700">{t.name}</span>
                <span className="text-sm text-gray-400">
                  {t.allocated}/{t.headcount} allocated · <span className={over ? "text-gray-900 font-medium" : "text-gray-500"}>{t.utilization}%</span>
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${over ? "bg-status-critical" : "bg-chart-line"}`} style={{ width: `${t.utilization}%` }} />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
