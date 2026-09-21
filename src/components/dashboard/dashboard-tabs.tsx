"use client";

export default function DashboardTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}) {
  return (
    <div className="flex gap-6 items-end">
      {tabs.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className="relative pb-2 cursor-pointer"
          >
            <span
              className={`text-2xl font-bold leading-none transition-colors ${
                isActive ? "text-gray-900" : "text-gray-500 hover:text-gray-600"
              }`}
            >
              {tab}
            </span>
            {isActive && (
              <span className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-gray-900 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
