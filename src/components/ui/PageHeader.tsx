export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-3xl font-black tracking-tight">{title}</h1>{subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}</div>
      {action}
    </div>
  );
}
