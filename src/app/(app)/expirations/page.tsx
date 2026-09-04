import { ExpirationBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageNavigation } from "@/components/ui/PageNavigation";
import { requireSession } from "@/lib/auth/session";
import { listStock } from "@/lib/services/stock.service";

export default async function ExpirationsPage({
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
        title="Validades"
        subtitle="Produtos ordenados pela data de vencimento mais próxima"
      />
      <div className="card overflow-hidden">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Marca</th>
                <th>Validade</th>
                <th>Quantidade</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {batches.content.map((batch) => (
                <tr key={batch.id}>
                  <td className="font-bold">{batch.product.name}</td>
                  <td>{batch.product.brand || "—"}</td>
                  <td>
                    {new Intl.DateTimeFormat("pt-BR").format(
                      new Date(`${batch.expirationDate}T12:00:00`),
                    )}
                  </td>
                  <td>{batch.quantity}</td>
                  <td>
                    <ExpirationBadge date={batch.expirationDate} />
                  </td>
                </tr>
              ))}
              {!batches.content.length && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-zinc-500">
                    Nenhuma validade cadastrada nesta filial.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PageNavigation
          pathname="/expirations"
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
