import { Box, ChartNoAxesCombined, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { Brand } from "@/components/ui/Brand";
import { readSession } from "@/lib/auth/session";

export default async function LoginPage() {
  if (await readSession()) redirect("/dashboard");
  return (
    <main className="min-h-screen bg-[#f6f6f6] p-4 md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-xl lg:grid-cols-[0.8fr_1.2fr]">
        <section className="relative hidden overflow-hidden bg-[#080808] p-12 text-white lg:flex lg:flex-col">
          <div className="absolute -right-20 -top-24 size-80 rounded-full border border-yellow-400/15" />
          <div className="absolute -right-10 -top-16 size-64 rounded-full border border-yellow-400/10" />
          <Brand inverse />
          <div className="my-auto max-w-md">
            <h1 className="text-4xl font-black leading-tight">
              Gestão completa
              <br />
              <span className="text-[#ffcc00]">para o seu mercadinho</span>
            </h1>
            <p className="mt-5 text-lg leading-7 text-zinc-300">
              Controle produtos, estoque, validade e movimentações em um só
              lugar, de forma simples e eficiente.
            </p>
            <div className="mt-10 space-y-6">
              {[
                [
                  Box,
                  "Estoque inteligente",
                  "Acompanhe entradas, saídas e vencimentos.",
                ],
                [
                  ChartNoAxesCombined,
                  "Indicadores objetivos",
                  "Dados operacionais para decisões rápidas.",
                ],
                [
                  ShieldCheck,
                  "Segurança e confiabilidade",
                  "Acesso por perfil, filial e auditoria.",
                ],
              ].map(([Icon, title, text]) => {
                const IconComponent = Icon as typeof Box;
                return (
                  <div className="flex gap-4" key={title as string}>
                    <div className="grid size-11 shrink-0 place-items-center rounded-full bg-yellow-400/10 text-[#ffcc00]">
                      <IconComponent size={22} />
                    </div>
                    <div>
                      <div className="font-bold">{title as string}</div>
                      <div className="mt-1 text-sm leading-5 text-zinc-400">
                        {text as string}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="h-24 rounded-2xl bg-[linear-gradient(135deg,rgba(255,204,0,.18),transparent_55%)]" />
        </section>
        <section className="flex items-center justify-center px-6 py-10 md:px-14">
          <div className="w-full max-w-xl">
            <div className="card p-7 md:p-11">
              <div className="mb-8 flex justify-center">
                <Brand />
              </div>
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-black">Acessar o sistema</h2>
                <p className="mt-2 text-zinc-500">
                  Entre com suas credenciais para continuar
                </p>
              </div>
              <LoginForm />
            </div>
            <p className="mt-7 text-center text-xs text-zinc-400">
              Mercadinho São Francisco • Sistema interno de gestão
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
