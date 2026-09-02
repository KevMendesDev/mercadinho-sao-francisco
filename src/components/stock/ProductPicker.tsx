"use client";

import { useEffect, useState } from "react";
import { requestJson } from "@/lib/client-api";

export type ProductOption = { id: string; name: string; barcode: string | null };

export function ProductPicker({ value, selectedProduct, onChange }: { value: string; selectedProduct?: ProductOption | null; onChange: (product: ProductOption) => void }) {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) return;
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      void requestJson<{ content: ProductOption[] }>(`/api/products?search=${encodeURIComponent(term)}&size=20`, {}, "Não foi possível buscar produtos.")
        .then(({ content }) => { if (!cancelled) { setProducts(content); setError(""); } })
        .catch((reason: Error) => { if (!cancelled) setError(reason.message); });
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, [search]);

  const visibleProducts = search.trim().length >= 2 ? products : [];
  const options = [selectedProduct, ...visibleProducts].filter((product): product is ProductOption => Boolean(product)).filter((product, index, list) => list.findIndex((item) => item.id === product.id) === index);
  return <div className="space-y-2"><input value={search} onChange={(event) => setSearch(event.target.value)} className="field" placeholder="Busque por nome, marca ou código" /><select required value={value} onChange={(event) => { const product = options.find((item) => item.id === event.target.value); if (product) onChange(product); }} className="field"><option value="">Selecione um produto</option>{options.map((product) => <option key={product.id} value={product.id}>{product.name}{product.barcode ? ` — ${product.barcode}` : ""}</option>)}</select>{error && <p className="text-sm text-red-700">{error}</p>}</div>;
}
