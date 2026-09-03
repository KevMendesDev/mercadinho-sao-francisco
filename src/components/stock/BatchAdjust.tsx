"use client";

import { FormEvent, useState } from "react";
import { PencilLine, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/client-api";

export function BatchAdjust({ batchId, productName, currentQuantity }: { batchId: string; productName: string; currentQuantity: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      await requestJson(`/api/stock/batches/${batchId}/adjust`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newQuantity: form.get("newQuantity"), reason: form.get("reason") }) }, "Erro ao ajustar lote.");
      setOpen(false); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Erro ao ajustar lote."); } finally { setLoading(false); }
  }

  return <>
    <button onClick={() => setOpen(true)} className="grid size-9 place-items-center rounded-lg border border-zinc-200" title="Ajustar quantidade"><PencilLine size={16}/></button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"><div className="card w-full max-w-md p-6">
      <div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-xl font-black">Ajustar lote</h2><p className="text-sm text-zinc-500">{productName} • saldo atual {currentQuantity}</p></div><button type="button" aria-label="Fechar ajuste de lote" onClick={() => setOpen(false)} className="grid size-10 shrink-0 place-items-center rounded-lg hover:bg-zinc-100"><X/></button></div>
      <form onSubmit={submit} className="space-y-4"><label className="block"><span className="mb-1.5 block text-sm font-bold">Nova quantidade</span><input required min="0" type="number" name="newQuantity" defaultValue={currentQuantity} className="field"/></label><label className="block"><span className="mb-1.5 block text-sm font-bold">Motivo da correção *</span><textarea required minLength={3} name="reason" className="field min-h-24" placeholder="Descreva por que o saldo precisa ser corrigido."/></label>{error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="flex gap-2"><button type="button" className="btn-secondary flex-1" onClick={() => setOpen(false)}>Cancelar</button><button className="btn-primary flex-1" disabled={loading}>{loading ? "Salvando..." : "Registrar ajuste"}</button></div></form>
    </div></div>}
  </>;
}
