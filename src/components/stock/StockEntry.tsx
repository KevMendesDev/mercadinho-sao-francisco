"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProductCreate, type ProductPrefill } from "@/components/products/ProductCreate";
import { BarcodeScanner } from "@/components/ui/BarcodeScanner";
import { requestJson } from "@/lib/client-api";
import { ProductOption, ProductPicker } from "./ProductPicker";

export function StockEntry({
  branchId,
  canCreateProduct,
}: {
  branchId: string;
  canCreateProduct: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(
    null,
  );
  const [productId, setProductId] = useState("");
  const [barcode, setBarcode] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [quantidade, setQuantidade] = useState<string>("");
  const [barcodeToCreate, setBarcodeToCreate] = useState("");
  const [productToCreate, setProductToCreate] = useState<Partial<ProductPrefill>>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const apenasNumeros = e.target.value.replace(/[^0-9]/g, "");
    setQuantidade(apenasNumeros);
  };

  function addProduct(product: ProductOption) {
    setSelectedProduct(product);
    setProductId(product.id);
    setError("");
  }
  function openCreate(code = "", fields: Partial<ProductPrefill> = {}) {
    setBarcodeToCreate(code);
    setProductToCreate(fields);
    setCreateOpen(true);
  }
  async function selectByBarcode(value: string) {
    const code = value.replace(/\D/g, "");
    setBarcode(code);
    if (!/^\d{8,14}$/.test(code)) {
      setError("Informe um código de barras válido.");
      return;
    }
    try {
      const data = await requestJson<{
        source?: string;
        product?: ProductOption | (Partial<ProductPrefill> & { brand?: string | null });
      }>(`/api/products/lookup/${code}`, {}, "Produto não encontrado.");
      if (data.source === "LOCAL" && data.product && "id" in data.product) {
        addProduct(data.product);
        return;
      }
      if (canCreateProduct) {
        const externalProduct = data.product && !("id" in data.product)
          ? { ...data.product, brand: data.product.brand ?? "" }
          : {};
        openCreate(code, externalProduct);
        return;
      }
      setError(
        data.source === "EXTERNAL_UNAVAILABLE"
          ? "O catálogo externo está indisponível. Cadastre o produto manualmente ou tente novamente."
          : "Produto não encontrado no catálogo.",
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível consultar o produto.",
      );
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await requestJson(
        "/api/stock/entries",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            branchId,
            quantity: form.get("quantity"),
            expirationDate: form.get("expirationDate"),
            reason: form.get("reason") || null,
          }),
        },
        "Erro ao adicionar estoque.",
      );
      setOpen(false);
      router.refresh();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Erro ao adicionar estoque.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <Plus size={18} />
        Entrada de estoque
      </button>
      {canCreateProduct && (
        <ProductCreate
          key={`${barcodeToCreate}-${createOpen ? "open" : "closed"}`}
          hideTrigger
          open={createOpen}
          onOpenChange={setCreateOpen}
          initialBarcode={barcodeToCreate}
          initialFields={productToCreate}
          onCreated={addProduct}
        />
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="card w-full max-w-xl p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Nova entrada</h2>
                <p className="text-sm text-zinc-500">
                  Será criado um lote interno para esta validade.
                </p>
              </div>
              <button
                type="button"
                aria-label="Fechar entrada de estoque"
                onClick={() => setOpen(false)}
                className="grid size-10 shrink-0 place-items-center rounded-lg hover:bg-zinc-100"
              >
                <X />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <span className="mb-1.5 block text-sm font-bold">Produto</span>
                <div className="mb-2 flex flex-wrap gap-2">
                  <input
                    value={barcode}
                    onChange={(event) => setBarcode(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void selectByBarcode(barcode);
                      }
                    }}
                    className="field min-w-0 flex-1"
                    placeholder="Escaneie ou digite o código e pressione Enter"
                  />
                  <BarcodeScanner
                    className="btn-secondary shrink-0"
                    onDetected={(value) => void selectByBarcode(value)}
                  />
                </div>
                <ProductPicker
                  value={productId}
                  selectedProduct={selectedProduct}
                  onChange={addProduct}
                  onAddProduct={
                    canCreateProduct ? () => openCreate(barcode) : undefined
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-1.5 block text-sm font-bold">
                    Quantidade
                  </span>
                  <input
                    required
                    min="1"
                    name="quantity"
                    pattern="[0-9]*"
                    maxLength={5}
                    value={quantidade}
                    onChange={handleChange}
                    className="field"
                  />
                </label>
                <label>
                  <span className="mb-1.5 block text-sm font-bold">
                    Validade
                  </span>
                  <input
                    required
                    type="date"
                    name="expirationDate"
                    className="field"
                  />
                </label>
              </div>
              <label>
                <span className="mb-1.5 block text-sm font-bold">
                  Motivo/observação
                </span>
                <input
                  name="reason"
                  className="field"
                  placeholder="Compra, transferência..."
                />
              </label>
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </button>
                <button className="btn-primary" disabled={loading}>
                  {loading ? "Salvando..." : "Registrar entrada"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
