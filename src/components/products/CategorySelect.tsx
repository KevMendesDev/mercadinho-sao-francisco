"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { requestJson } from "@/lib/client-api";

type Category = { id: string; name: string };
const ADD_CATEGORY = "__add_category__";

export function CategorySelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => { void requestJson<Category[]>("/api/categories", {}, "Não foi possível carregar as categorias.").then(setCategories).catch((reason: Error) => setError(reason.message)); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); event.stopPropagation(); setLoading(true); setError("");
    try {
      const category = await requestJson<Category>("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) }, "Erro ao cadastrar categoria.");
      setCategories((current) => [...current, category].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
      onChange(category.id); setName(""); setOpen(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Erro ao cadastrar categoria."); } finally { setLoading(false); }
  }
  return <><select className="field" value={value} onChange={(event) => event.target.value === ADD_CATEGORY ? setOpen(true) : onChange(event.target.value)}><option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}<option value={ADD_CATEGORY}>+ Adicionar categoria</option></select>
    {open && typeof document !== "undefined" && createPortal(<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4"><div className="card w-full max-w-md p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black">Nova categoria</h2><button type="button" onClick={() => setOpen(false)} aria-label="Fechar"><X/></button></div><form onSubmit={submit} className="space-y-4"><label><span className="mb-1.5 block text-sm font-bold">Nome *</span><input required autoFocus className="field" value={name} onChange={(event) => setName(event.target.value)} /></label>{error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="btn-primary" disabled={loading}>{loading ? "Salvando..." : "Salvar categoria"}</button></div></form></div></div>, document.body)}
  </>;
}
