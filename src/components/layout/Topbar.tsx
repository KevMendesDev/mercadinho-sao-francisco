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
    <header className="flex min-h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 md:px-6">
      <div className="font-black lg:hidden">MSF</div>
      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <div className="relative hidden sm:block"><Building2 className="pointer-events-none absolute left-3 top-3 text-zinc-600" size={18}/><select value={branchId} disabled={changing} onChange={(event) => changeBranch(event.target.value)} className="field min-w-48 py-2.5 pl-9 text-sm">{branches.map((branch) => <option key={branch.id} value={branch.id}>Filial: {branch.name}</option>)}</select></div>
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm font-semibold"><UserCircle2 size={19}/><span className="hidden md:inline">{name}</span></div>
        <button onClick={logout} className="grid size-10 place-items-center rounded-lg border border-zinc-200 hover:bg-zinc-50" title="Sair"><LogOut size={18}/></button>
      </div>
    </header>
  );
}
