"use client";

import { Building2, LogOut, UserCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestJson } from "@/lib/client-api";

type BranchOption = { id: string; name: string };

export function Topbar({ name, branchId, branches }: { name: string; branchId: string; branches: BranchOption[] }) {
  const router = useRouter();
  const [changing, setChanging] = useState(false);

  async function changeBranch(value: string) {
    setChanging(true);
    try { await requestJson("/api/auth/switch-branch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ branchId: value }) }, "Não foi possível trocar a filial."); router.refresh(); }
    catch (reason) { window.alert(reason instanceof Error ? reason.message : "Não foi possível trocar a filial."); }
    finally { setChanging(false); }
  }

  async function logout() {
    try { await requestJson("/api/auth/logout", { method: "POST" }, "Não foi possível encerrar a sessão."); router.replace("/login"); router.refresh(); }
    catch (reason) { window.alert(reason instanceof Error ? reason.message : "Não foi possível encerrar a sessão."); }
  }

  return (
    <header className="flex min-h-16 items-center justify-end border-b border-zinc-200 bg-white px-3 pl-16 md:px-6 md:pl-16 lg:pl-6">
      <div className="flex w-full min-w-0 items-center justify-end gap-2 md:gap-3">
        <div className="relative min-w-0 max-w-[16rem] flex-1 sm:flex-none"><Building2 className="pointer-events-none absolute left-3 top-3 text-zinc-600" size={18}/><select aria-label="Filial selecionada" value={branchId} disabled={changing} onChange={(event) => changeBranch(event.target.value)} className="field w-full min-w-0 truncate py-2.5 pl-9 pr-2 text-xs sm:w-[min(42vw,16rem)] sm:text-sm">{branches.map((branch) => <option key={branch.id} value={branch.id}>Filial: {branch.name}</option>)}</select></div>
        <div className="flex shrink-0 items-center gap-2 rounded-lg border border-zinc-200 px-2 py-2.5 text-sm font-semibold sm:px-3"><UserCircle2 size={19}/><span className="hidden md:inline">{name}</span></div>
        <button onClick={logout} aria-label="Sair" className="grid size-10 shrink-0 place-items-center rounded-lg border border-zinc-200 hover:bg-zinc-50" title="Sair"><LogOut size={18}/></button>
      </div>
    </header>
  );
}
