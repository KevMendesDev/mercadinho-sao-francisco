import Link from "next/link";
import { PageSizeSelect } from "./PageSizeSelect";

export function PageNavigation({ pathname, page, totalPages, totalElements, size = 20, itemLabel = "item", params = {} }: { pathname: string; page: number; totalPages: number; totalElements: number; size?: number; itemLabel?: string; params?: Record<string, string> }) {
  const href = (target: number) => `${pathname}?${new URLSearchParams({ ...params, page: String(target), ...(size ? { size: String(size) } : {}) }).toString()}`;
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3 text-sm">
    <span className="text-zinc-500">{totalElements} {itemLabel}(s) • página {page} de {totalPages}</span>
    <PageSizeSelect value={size}/>
    <div className="flex gap-2"><Link aria-disabled={page <= 1} className={`btn-secondary py-2 ${page <= 1 ? "pointer-events-none opacity-40" : ""}`} href={href(Math.max(1, page - 1))}>Anterior</Link><Link aria-disabled={page >= totalPages} className={`btn-secondary py-2 ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`} href={href(Math.min(totalPages, page + 1))}>Próxima</Link></div>
  </div>;
}
