"use client";

import WidgetChat from "@/components/dashboard/widget-chat";

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right";
  /** Optional Tailwind width class for the column, e.g. "w-32". */
  className?: string;
}

interface Props<T> {
  title: string;
  subtitle?: string;
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
  onRowClick: (row: T) => void;
  /** Optional filter controls shown in the header. */
  toolbar?: React.ReactNode;
}

export default function DataTable<T>({ title, subtitle, columns, rows, getKey, onRowClick, toolbar }: Props<T>) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {toolbar}
          <WidgetChat title={title} />
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {columns.map((c, i) => (
                <th
                  key={i}
                  className={`px-5 py-3 text-[11px] text-gray-500 tracking-wider font-normal whitespace-nowrap ${
                    c.align === "right" ? "text-right" : "text-left"
                  } ${c.className ?? ""}`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={getKey(row)}
                onClick={() => onRowClick(row)}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {columns.map((c, i) => (
                  <td
                    key={i}
                    className={`px-5 py-3.5 align-middle ${c.align === "right" ? "text-right" : "text-left"}`}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-10">Nothing to show here yet.</p>
        )}
      </div>
    </div>
  );
}
