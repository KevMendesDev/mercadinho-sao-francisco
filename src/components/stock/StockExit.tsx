"use client";

import { FormEvent, useState } from "react";
import { Minus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/client-api";
import { ProductOption, ProductPicker } from "./ProductPicker";

export function StockExit({ branchId }: { branchId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [product, setProduct] = useState<ProductOption | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      await requestJson("/api/stock/exit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product?.id, branchId, quantity: form.get("quantity"), reason: form.get("reason") }) }, "Erro ao registrar saída.");
      setOpen(false); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Erro ao registrar saída."); } finally { setLoading(false); }
  }

  return <>
    <button className="btn-secondary" onClick={() => setOpen(true)}><Minus size={18}/>Registrar saída</button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"><div className="card w-full max-w-lg p-6">
      <div className="mb-5 flex justify-between"><div><h2 className="text-xl font-black">Saída de estoque</h2><p className="text-sm text-zinc-500">A baixa usa FEFO: primeiro os lotes que vencem antes.</p></div><button onClick={() => setOpen(false)}><X/></button></div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block"><span className="mb-1.5 block text-sm font-bold">Produto</span><ProductPicker value={product?.id ?? ""} selectedProduct={product} onChange={setProduct}/></label>
        <label className="block"><span className="mb-1.5 block text-sm font-bold">Quantidade</span><input required min="1" type="number" name="quantity" className="field"/></label>
        <label className="block"><span className="mb-1.5 block text-sm font-bold">Motivo *</span><input required minLength={3} name="reason" className="field" placeholder="Venda manual, perda, transferência..."/></label>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="btn-primary" disabled={loading}>{loading ? "Registrando..." : "Confirmar saída"}</button></div>
      </form>
    </div></div>}
  </>;
}
