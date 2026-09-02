"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function PageSizeSelect({ value }: { value: number }) {
  const router = useRouter(); const pathname = usePathname(); const params = useSearchParams();
  return <label className="flex items-center gap-2 text-sm text-zinc-600">Por página <select className="field w-auto py-2" value={value} onChange={(event) => { const next = new URLSearchParams(params); next.set("size", event.target.value); next.set("page", "1"); router.push(`${pathname}?${next.toString()}`); }}><option value="20">20</option><option value="50">50</option><option value="100">100</option><option value="500">500</option></select></label>;
}
