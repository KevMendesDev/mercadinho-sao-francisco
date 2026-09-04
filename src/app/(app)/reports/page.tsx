import { PageHeader } from "@/components/ui/PageHeader";
export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Relatórios"
        subtitle="Módulo reservado para a próxima etapa"
      />
      <div className="card p-8 text-zinc-600">
        A base de dados e as movimentações já foram modeladas para permitir
        relatórios por produto, filial, validade e período sem duplicar a regra
        de estoque.
      </div>
    </>
  );
}
