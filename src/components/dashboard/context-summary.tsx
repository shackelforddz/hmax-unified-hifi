import { TriangleAlert } from "lucide-react";

/** The "Context summary" card at the top of a detail drawer. When the record
 *  is critical it switches to a red alert state so it can't be skimmed past.
 *  `children` holds whatever follows the summary (recommended actions etc.). */
export default function ContextSummary({
  summary,
  critical = false,
  children,
}: {
  summary: string;
  critical?: boolean;
  children?: React.ReactNode;
}) {
  if (!critical) {
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
        <h3 className="text-base text-gray-900 mb-4">Context summary</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{summary}</p>
        {children}
      </div>
    );
  }
  return (
    <div role="alert" className="bg-red-50 border border-status-critical/40 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="flex items-center gap-2 text-base text-status-critical">
          <TriangleAlert size={16} strokeWidth={2} className="shrink-0" />
          Context summary
        </h3>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-status-critical-deep text-white font-bold whitespace-nowrap">Critical</span>
      </div>
      <p className="text-sm text-gray-800 leading-relaxed">{summary}</p>
      {children}
    </div>
  );
}
