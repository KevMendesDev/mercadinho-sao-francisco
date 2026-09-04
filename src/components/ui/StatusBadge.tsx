export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`badge ${active ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}
    >
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

export function ExpirationBadge({ date }: { date: string }) {
  const days = daysUntilDate(date);
  const style =
    days < 0
      ? "bg-zinc-900 text-white"
      : days <= 15
        ? "bg-red-50 text-red-700 ring-1 ring-red-200"
        : days <= 60
          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  return (
    <span className={`badge ${style}`}>
      {days < 0 ? `${Math.abs(days)}d vencido` : `${days} dias`}
    </span>
  );
}
import { daysUntilDate } from "@/lib/date";
