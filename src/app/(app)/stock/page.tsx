import { StockEntry } from "@/components/stock/StockEntry";
import { StockExit } from "@/components/stock/StockExit";
import { BatchAdjust } from "@/components/stock/BatchAdjust";
import { ExpirationBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageNavigation } from "@/components/ui/PageNavigation";
import { UserRole } from "@/database/entities";
import { requireSession } from "@/lib/auth/session";
import { listStock } from "@/lib/services/stock.service";

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string }>;
}) {
  const session = await requireSession();
  const { page, size } = await searchParams;
  const batches = await listStock(session.branchId, Number(page), Number(size));
  return (
    <>
      <PageHeader
        title="Estoque"
        subtitle="Saldo por lote e validade da filial selecionada"
        action={
          <div className="flex gap-2">
            <StockExit branchId={session.branchId} />
            <StockEntry
              branchId={session.branchId}
              canCreateProduct={[UserRole.ADMIN, UserRole.MANAGER].includes(
                session.role,
              )}
            />
          </div>
        }
      />
      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Regra de auditoria:</strong> entradas, saídas e correções são
        registradas como movimentações.
      </div>
      <div className="card overflow-hidden">
        <div className="table-wrap">
          <table className="table-with-actions">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Código</th>
                <th>Lote interno</th>
                <th>Validade</th>
                <th>Quantidade</th>
                <th>Prazo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {batches.content.map((batch) => (
                <tr key={batch.id}>
                  <td className="font-bold">{batch.product.name}</td>
                  <td className="font-mono text-xs">
                    {batch.product.barcode || "—"}
                  </td>
                  <td className="font-mono text-xs">{batch.id.slice(0, 8)}</td>
                  <td>
                    {new Intl.DateTimeFormat("pt-BR").format(
                      new Date(`${batch.expirationDate}T12:00:00`),
                    )}
                  </td>
                  <td className="text-lg font-black">{batch.quantity}</td>
                  <td>
                    <ExpirationBadge date={batch.expirationDate} />
                  </td>
                  <td>
                    {[UserRole.ADMIN, UserRole.MANAGER].includes(
                      session.role,
                    ) ? (
                      <BatchAdjust
                        batchId={batch.id}
                        productName={batch.product.name}
                        currentQuantity={batch.quantity}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
              {!batches.content.length && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-zinc-500">
                    Nenhum lote com saldo nesta filial.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PageNavigation
          pathname="/stock"
          page={batches.page}
          totalPages={batches.totalPages}
          totalElements={batches.totalElements}
          size={batches.size}
          itemLabel="lote"
        />
      </div>
    </>
  );
}
