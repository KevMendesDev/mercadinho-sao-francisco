import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="card p-4 md:p-5">
      <div className="flex items-center gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-full bg-[#ffcc00]">
          <Icon size={22} strokeWidth={2.2} />
        </div>
        <div>
          <div className="text-sm text-zinc-600">{label}</div>
          <div className="mt-0.5 text-2xl font-black">{value}</div>
        </div>
      </div>
      {hint && <div className="mt-4 text-xs text-zinc-500">{hint}</div>}
    </div>
  );
}
