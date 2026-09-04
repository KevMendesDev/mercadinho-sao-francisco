import { PageHeader } from "@/components/ui/PageHeader";
export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Configurações" subtitle="Parâmetros administrativos" />
      <div className="card p-8 text-zinc-600">
        Próximos itens: limites de alerta, dados reais das filiais, integração
        com PDV e preferências de notificação.
      </div>
    </>
  );
}
