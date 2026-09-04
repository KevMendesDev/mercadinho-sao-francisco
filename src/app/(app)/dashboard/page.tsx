import { AlertTriangle, Boxes, CalendarClock, Package } from "lucide-react";
import { ExpirationBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { requireSession } from "@/lib/auth/session";
import { getDashboard } from "@/lib/services/dashboard.service";

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}
function movementLabel(type: string) {
  return type === "ENTRY" ? "Entrada" : type === "EXIT" ? "Saída" : "Ajuste";
}

export default async function DashboardPage() {
  const session = await requireSession();
  const data = await getDashboard(session.branchId);
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Visão geral do sistema" />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Package}
          label="Produtos cadastrados"
          value={data.products.toLocaleString("pt-BR")}
          hint="Catálogo global ativo"
        />
        <StatCard
          icon={Boxes}
          label="Estoque total"
          value={data.totalUnits.toLocaleString("pt-BR")}
          hint="Unidades na filial selecionada"
        />
        <StatCard
          icon={CalendarClock}
          label="Próximos do vencimento"
          value={data.expiring}
          hint="Lotes que vencem em até 30 dias"
        />
        <StatCard
          icon={AlertTriangle}
          label="Vencidos"
          value={data.expired}
          hint="Lotes com saldo e validade expirada"
        />
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-zinc-200 p-4 font-bold">
            Produtos próximos do vencimento
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Validade</th>
                  <th>Saldo</th>
                  <th>Prazo</th>
                </tr>
              </thead>
              <tbody>
                {data.expiringItems.length ? (
                  data.expiringItems.map((batch) => (
                    <tr key={batch.id}>
                      <td className="font-semibold">{batch.product.name}</td>
                      <td>{formatDate(`${batch.expirationDate}T12:00:00`)}</td>
                      <td>{batch.quantity}</td>
                      <td>
                        <ExpirationBadge date={batch.expirationDate} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500">
                      Nenhum lote em estoque.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card overflow-hidden">
          <div className="border-b border-zinc-200 p-4 font-bold">
            Últimas movimentações
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Produto</th>
                  <th>Qtd.</th>
                  <th>Usuário</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.length ? (
                  data.recent.map((movement) => (
                    <tr key={movement.id}>
                      <td>{formatDate(movement.createdAt)}</td>
                      <td className="font-semibold">
                        {movementLabel(movement.type)}
                      </td>
                      <td>{movement.product.name}</td>
                      <td>{movement.quantity}</td>
                      <td>{movement.user?.name ?? "Sistema"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      Nenhuma movimentação registrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
