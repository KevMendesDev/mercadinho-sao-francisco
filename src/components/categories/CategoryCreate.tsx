"use client";

import { FormEvent, useState } from "react";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/client-api";

export function CategoryCreate() {
  const router = useRouter(); const [open, setOpen] = useState(false); const [name, setName] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      await requestJson("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) }, "Erro ao cadastrar categoria.");
      setName(""); setOpen(false); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Erro ao cadastrar categoria."); } finally { setLoading(false); }
  }
  return <><button className="btn-primary" onClick={() => setOpen(true)}><Plus size={18}/>Nova categoria</button>{open && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4"><div role="dialog" aria-modal="true" aria-labelledby="new-category-title" className="card w-full max-w-md p-6"><div className="mb-5 flex items-center justify-between"><div><h2 id="new-category-title" className="text-xl font-black">Nova categoria</h2><p className="text-sm text-zinc-500">Cadastre uma categoria para o catálogo.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="grid size-10 place-items-center rounded-lg hover:bg-zinc-100"><X/></button></div><form onSubmit={submit} className="space-y-4"><label><span className="mb-1.5 block text-sm font-bold">Nome *</span><input required autoFocus className="field" value={name} onChange={(event) => setName(event.target.value)}/></label>{error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="btn-primary" disabled={loading}>{loading ? "Salvando..." : "Salvar categoria"}</button></div></form></div></div>}</>;
}
