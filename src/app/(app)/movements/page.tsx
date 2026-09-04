import { PageHeader } from "@/components/ui/PageHeader";
import { PageNavigation } from "@/components/ui/PageNavigation";
import { requireSession } from "@/lib/auth/session";
import { listMovements } from "@/lib/services/stock.service";

const labels: Record<string, string> = {
  ENTRY: "Entrada",
  EXIT: "Saída",
  ADJUSTMENT: "Ajuste",
};

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string }>;
}) {
  const session = await requireSession();
  const { page, size } = await searchParams;
  const movements = await listMovements(
    session.branchId,
    Number(page),
    Number(size),
  );
  return (
    <>
      <PageHeader
        title="Movimentações"
        subtitle="Histórico auditável de alterações do estoque"
      />
      <div className="card overflow-hidden">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Tipo</th>
                <th>Produto</th>
                <th>Qtd.</th>
                <th>Origem</th>
                <th>Motivo</th>
                <th>Usuário</th>
              </tr>
            </thead>
            <tbody>
              {movements.content.map((movement) => (
                <tr key={movement.id}>
                  <td>
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(movement.createdAt)}
                  </td>
                  <td>
                    <span
                      className={`badge ${movement.type === "ENTRY" ? "bg-emerald-50 text-emerald-700" : movement.type === "EXIT" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}
                    >
                      {labels[movement.type]}
                    </span>
                  </td>
                  <td className="font-bold">{movement.product.name}</td>
                  <td className="font-black">{movement.quantity}</td>
                  <td>{movement.source}</td>
                  <td>{movement.reason || "—"}</td>
                  <td>{movement.user?.name || "Sistema"}</td>
                </tr>
              ))}
              {!movements.content.length && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-zinc-500">
                    Nenhuma movimentação registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PageNavigation
          pathname="/movements"
          page={movements.page}
          totalPages={movements.totalPages}
          totalElements={movements.totalElements}
          size={movements.size}
          itemLabel="movimentação"
        />
      </div>
    </>
  );
}
