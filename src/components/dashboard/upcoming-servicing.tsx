import { UPCOMING_SERVICING, type ServicingStatus } from "@/lib/dashboard-data";
import WidgetChat from "./widget-chat";

const TITLE = "Upcoming servicing";

function StatusDot({ status }: { status: ServicingStatus }) {
  const cls =
    status === "late" ? "bg-gray-900"
    : status === "at-risk" ? "bg-gray-500"
    : "bg-gray-300";
  return <span className={`w-2 h-2 rounded-full shrink-0 ${cls}`} />;
}

function DueBadge({ status, dueIn }: { status: ServicingStatus; dueIn: string }) {
  const cls =
    status === "late" ? "bg-gray-900 text-white"
    : status === "at-risk" ? "bg-gray-100 text-gray-700"
    : "border border-gray-200 text-gray-400";
  return <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>{dueIn}</span>;
}

export default function UpcomingServicing() {
  const overdue = UPCOMING_SERVICING.filter((s) => s.status === "late").length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base text-gray-900">{TITLE}</h3>
          <p className="text-sm text-gray-400 mt-0.5">
            scheduled maintenance · {overdue > 0 ? `${overdue} overdue` : "all on schedule"}
          </p>
        </div>
        <WidgetChat title={TITLE} />
      </div>

      {/* List */}
      <div className="flex flex-col">
        {UPCOMING_SERVICING.map((s, i) => (
          <div
            key={`${s.customer}-${s.task}`}
            className={`flex items-center gap-3 py-3 ${i < UPCOMING_SERVICING.length - 1 ? "border-b border-gray-100" : ""}`}
          >
            <StatusDot status={s.status} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">
                {s.task} <span className="text-gray-400">· {s.customer}</span>
              </p>
              <p className="text-xs text-gray-400 truncate">
                {s.interval} · {s.owner} · due {s.due}
              </p>
            </div>
            <DueBadge status={s.status} dueIn={s.dueIn} />
          </div>
        ))}
      </div>
    </div>
  );
}
