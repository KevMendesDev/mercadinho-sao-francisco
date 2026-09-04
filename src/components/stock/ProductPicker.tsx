"use client";

import { useEffect, useState } from "react";
import { requestJson } from "@/lib/client-api";

export type ProductOption = {
  id: string;
  name: string;
  barcode: string | null;
};

const ADD_PRODUCT = "__add_product__";

export function ProductPicker({
  value,
  selectedProduct,
  onChange,
  onAddProduct,
}: {
  value: string;
  selectedProduct?: ProductOption | null;
  onChange: (product: ProductOption) => void;
  onAddProduct?: () => void;
}) {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void requestJson<{ content: ProductOption[] }>(
      "/api/products?size=500",
      {},
      "Não foi possível carregar os produtos.",
    )
      .then(({ content }) => {
        if (!cancelled) {
          setProducts(content);
          setError("");
        }
      })
      .catch((reason: Error) => {
        if (!cancelled) setError(reason.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const options = [selectedProduct, ...products]
    .filter((product): product is ProductOption => Boolean(product))
    .filter(
      (product, index, list) =>
        list.findIndex((item) => item.id === product.id) === index,
    );
  return (
    <div>
      <select
        required
        value={value}
        onChange={(event) => {
          if (event.target.value === ADD_PRODUCT) {
            onAddProduct?.();
            return;
          }
          const product = options.find(
            (item) => item.id === event.target.value,
          );
          if (product) onChange(product);
        }}
        className="field"
      >
        <option value="">Selecione um produto</option>
        {options.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
            {product.barcode ? ` — ${product.barcode}` : ""}
          </option>
        ))}
        {onAddProduct && (
          <option value={ADD_PRODUCT}>+ Cadastrar produto</option>
        )}
      </select>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
