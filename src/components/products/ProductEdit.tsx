"use client";

import { FormEvent, useState } from "react";
import { Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { CategorySelect } from "./CategorySelect";
import { requestJson } from "@/lib/client-api";

type EditableProduct = { id: string; name: string; brand: string | null; categoryId: string | null; barcode: string | null; unit: "ML" | "G" | "KG" | "L"; weight: string | null };

export function ProductEdit({ product }: { product: EditableProduct }) {
  const router = useRouter(); const [open, setOpen] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const [fields, setFields] = useState({ barcode: product.barcode ?? "", name: product.name, brand: product.brand ?? "", categoryId: product.categoryId ?? "", weight: product.weight ?? "", unit: product.unit });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      await requestJson(`/api/products/${product.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields) }, "Erro ao atualizar produto.");
      setOpen(false); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Erro ao atualizar produto."); } finally { setLoading(false); }
  }
  return <><button className="btn-secondary px-3 py-2" aria-label={`Editar ${product.name}`} onClick={() => setOpen(true)}><Pencil size={16}/>Editar</button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"><div className="card max-h-[92vh] w-full max-w-2xl overflow-y-auto p-6 md:p-7"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-xl font-black">Editar produto</h2><p className="text-sm text-zinc-500">Altere os dados do catálogo.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Fechar"><X/></button></div>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2"><label className="md:col-span-2"><span className="mb-1.5 block text-sm font-bold">Código de barras</span><input className="field" value={fields.barcode} onChange={(event) => setFields({ ...fields, barcode: event.target.value })}/></label><label><span className="mb-1.5 block text-sm font-bold">Nome *</span><input required className="field" value={fields.name} onChange={(event) => setFields({ ...fields, name: event.target.value })}/></label><label><span className="mb-1.5 block text-sm font-bold">Marca</span><input className="field" value={fields.brand} onChange={(event) => setFields({ ...fields, brand: event.target.value })}/></label><label><span className="mb-1.5 block text-sm font-bold">Categoria</span><CategorySelect value={fields.categoryId} onChange={(categoryId) => setFields({ ...fields, categoryId })}/></label><label><span className="mb-1.5 block text-sm font-bold">Peso *</span><input required min="0.001" step="any" type="number" inputMode="decimal" className="field" value={fields.weight} onChange={(event) => setFields({ ...fields, weight: event.target.value })}/></label><label><span className="mb-1.5 block text-sm font-bold">Unidade de medida *</span><select className="field" value={fields.unit} onChange={(event) => setFields({ ...fields, unit: event.target.value as EditableProduct["unit"]})}><option value="ML">ML (Mililitros)</option><option value="G">G (Gramas)</option><option value="KG">KG (Quilos)</option><option value="L">L (Litros)</option></select></label>{error && <div className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}<div className="md:col-span-2 mt-2 flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="btn-primary" disabled={loading}>{loading ? "Salvando..." : "Salvar alterações"}</button></div></form>
    </div></div>}
  </>;
}
