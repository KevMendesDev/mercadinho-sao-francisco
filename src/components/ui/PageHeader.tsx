export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0"><h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>{subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}</div>
      {action}
    </div>
  );
}
