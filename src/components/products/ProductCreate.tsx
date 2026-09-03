"use client";

import { FormEvent, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { BarcodeScanner } from "@/components/ui/BarcodeScanner";
import { CategorySelect } from "./CategorySelect";
import { requestJson } from "@/lib/client-api";

type CreatedProduct = { id: string; name: string; barcode: string | null };
type Fields = { barcode: string; name: string; brand: string; categoryId: string; weight: string; unit: "ML" | "G" | "KG" | "L" };
const emptyFields: Fields = { barcode: "", name: "", brand: "", categoryId: "", weight: "", unit: "G" };

export function ProductCreate({ onCreated, compact = false, open: controlledOpen, onOpenChange, initialBarcode, hideTrigger = false }: { onCreated?: (product: CreatedProduct) => void; compact?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void; initialBarcode?: string; hideTrigger?: boolean }) {
  const router = useRouter();
  const [localOpen, setLocalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lookup, setLookup] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Fields>(() => initialBarcode ? { ...emptyFields, barcode: initialBarcode.replace(/\D/g, "") } : emptyFields);
  const open = controlledOpen ?? localOpen;
  const setOpen = (value: boolean) => { setLocalOpen(value); onOpenChange?.(value); };

  async function lookupBarcode(value = fields.barcode) {
    const barcode = value.replace(/\D/g, "");
    if (!/^\d{8,14}$/.test(barcode)) { setError("Informe um código de barras válido."); return; }
    setFields((current) => ({ ...current, barcode })); setLookup(true); setError("");
    try {
      const data = await requestJson<{ source?: string; product?: Partial<Fields> }>(`/api/products/lookup/${barcode}`, {}, "Produto não encontrado no cadastro local nem no Open Food Facts.");
      if (!data.product) { setError(data.source === "EXTERNAL_UNAVAILABLE" ? "O Open Food Facts está indisponível. Preencha os dados do produto manualmente." : "Produto não encontrado no cadastro local nem no Open Food Facts."); return; }
      setFields((current) => ({ ...current, barcode, name: data.product?.name ?? "", brand: data.product?.brand ?? "", unit: data.product?.unit ?? "G" }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível consultar o produto."); } finally { setLookup(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const data = await requestJson<CreatedProduct>("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields) }, "Erro ao cadastrar produto.");
      setOpen(false); setFields(emptyFields); onCreated?.(data); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Erro ao cadastrar produto."); } finally { setLoading(false); }
  }

  return <>
    {!hideTrigger && <button className={compact ? "btn-secondary px-3 py-2" : "btn-primary"} onClick={() => setOpen(true)}><Plus size={18}/>Novo produto</button>}
    {open && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4"><div role="dialog" aria-modal="true" aria-labelledby="new-product-title" className="card max-h-[92vh] w-full max-w-2xl overflow-y-auto p-6 md:p-7">
      <div className="mb-6 flex items-center justify-between"><div><h2 id="new-product-title" className="text-xl font-black">Novo produto</h2><p className="text-sm text-zinc-500">O produto ficará disponível para todas as filiais.</p></div><button type="button" aria-label="Fechar" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-lg hover:bg-zinc-100"><X/></button></div>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <label className="md:col-span-2"><span className="mb-1.5 block text-sm font-bold">Código de barras</span><div className="flex flex-wrap gap-2"><input className="field min-w-0 flex-1" value={fields.barcode} onChange={(event) => setFields({ ...fields, barcode: event.target.value })} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void lookupBarcode(); } }} placeholder="789..."/><button type="button" onClick={() => void lookupBarcode()} className="btn-secondary shrink-0" disabled={lookup}><Search size={17}/>{lookup ? "Buscando" : "Consultar"}</button><BarcodeScanner className="btn-secondary shrink-0" onDetected={(barcode) => void lookupBarcode(barcode)}/></div></label>
        <label><span className="mb-1.5 block text-sm font-bold">Nome *</span><input required className="field" value={fields.name} onChange={(event) => setFields({ ...fields, name: event.target.value })}/></label>
        <label><span className="mb-1.5 block text-sm font-bold">Marca</span><input className="field" value={fields.brand} onChange={(event) => setFields({ ...fields, brand: event.target.value })}/></label>
        <label><span className="mb-1.5 block text-sm font-bold">Categoria</span><CategorySelect value={fields.categoryId} onChange={(categoryId) => setFields({ ...fields, categoryId })}/></label>
        <label><span className="mb-1.5 block text-sm font-bold">Peso *</span><input required min="0.001" step="any" type="number" inputMode="decimal" className="field" value={fields.weight} onChange={(event) => setFields({ ...fields, weight: event.target.value })}/></label>
        <label><span className="mb-1.5 block text-sm font-bold">Unidade de medida *</span><select className="field" value={fields.unit} onChange={(event) => setFields({ ...fields, unit: event.target.value as Fields["unit"]})}><option value="ML">ML (Mililitros)</option><option value="G">G (Gramas)</option><option value="KG">KG (Quilos)</option><option value="L">L (Litros)</option></select></label>
        {error && <div className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="md:col-span-2 mt-2 flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="btn-primary" disabled={loading}>{loading ? "Salvando..." : "Salvar produto"}</button></div>
      </form>
    </div></div>}
  </>;
}
