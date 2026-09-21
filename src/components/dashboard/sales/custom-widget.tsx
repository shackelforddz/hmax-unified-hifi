import { Plus } from "lucide-react";

export default function CustomWidget({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 py-10 hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer min-h-[220px] w-full"
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500">
        <Plus size={22} strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <p className="text-base text-gray-800">Custom Widget</p>
        <p className="text-sm text-gray-500">Create your own Widget</p>
      </div>
    </button>
  );
}
