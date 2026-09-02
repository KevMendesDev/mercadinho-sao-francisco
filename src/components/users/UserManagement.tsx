"use client";

import { FormEvent, useState } from "react";
import { Pencil, Plus, Power, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { UserRole } from "@/database/entities/enums";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requestJson } from "@/lib/client-api";

type Branch = { id: string; name: string };
type UserRow = { id: string; name: string; email: string; role: UserRole; active: boolean; lastAccessAt: string | null; branchIds: string[]; branches: string[] };

const empty = { id: "", name: "", email: "", role: UserRole.OPERATOR, active: true, branchIds: [] as string[], password: "" };

export function UserManagement({ initialUsers, branches, filters }: { initialUsers: UserRow[]; branches: Branch[]; filters: { search: string; role: string; status: string } }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  function newUser() { setForm(empty); setError(""); setOpen(true); }
  function edit(user: UserRow) { setForm({ id: user.id, name: user.name, email: user.email, role: user.role, active: user.active, branchIds: user.branchIds, password: "" }); setError(""); setOpen(true); }
  function toggleBranch(id: string) { setForm((current) => ({ ...current, branchIds: current.branchIds.includes(id) ? current.branchIds.filter((branchId) => branchId !== id) : [...current.branchIds, id] })); }

  async function save(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    const editing = Boolean(form.id);
    const payload = editing ? { name: form.name, role: form.role, active: form.active, branchIds: form.role === UserRole.ADMIN ? [] : form.branchIds } : { name: form.name, email: form.email, password: form.password, role: form.role, active: form.active, branchIds: form.role === UserRole.ADMIN ? [] : form.branchIds };
    try {
      await requestJson(editing ? `/api/users/${form.id}` : "/api/users", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }, "Erro ao salvar usuário.");
      setOpen(false); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Erro ao salvar usuário."); } finally { setLoading(false); }
  }

  async function toggleActive(user: UserRow) {
    if (!confirm(`${user.active ? "Desativar" : "Reativar"} ${user.name}?`)) return;
    try {
      await requestJson(`/api/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !user.active, role: user.role, branchIds: user.role === UserRole.ADMIN ? [] : user.branchIds }) }, "Não foi possível alterar o usuário.");
      router.refresh();
    } catch (reason) { alert(reason instanceof Error ? reason.message : "Não foi possível alterar o usuário."); }
  }

  return <>
    <div className="card mb-4 flex flex-wrap items-center gap-3 p-4"><form action="/users" className="flex flex-1 flex-wrap items-center gap-3"><div className="relative min-w-[260px] flex-1"><Search className="absolute left-3 top-3 text-zinc-500" size={18}/><input name="search" defaultValue={filters.search} className="field pl-10" placeholder="Buscar por nome ou e-mail"/></div><select name="role" defaultValue={filters.role} className="field w-auto min-w-40"><option value="ALL">Todos os perfis</option><option>ADMIN</option><option>MANAGER</option><option>OPERATOR</option></select><select name="status" defaultValue={filters.status} className="field w-auto min-w-36"><option value="ALL">Todos status</option><option value="ACTIVE">Ativos</option><option value="INACTIVE">Inativos</option></select><button className="btn-secondary">Filtrar</button></form><button className="btn-primary" onClick={newUser}><Plus size={18}/>Novo usuário</button></div>
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><strong>Exclusão lógica:</strong> usuários desativados mantêm histórico e podem ser reativados.</div>
    <div className="card overflow-hidden"><div className="table-wrap"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Filiais</th><th>Status</th><th>Último acesso</th><th>Ações</th></tr></thead><tbody>
      {initialUsers.map((user) => <tr key={user.id}><td className="font-bold">{user.name}</td><td>{user.email}</td><td><span className={`badge ${user.role === UserRole.ADMIN ? "bg-amber-100 text-amber-900" : user.role === UserRole.MANAGER ? "bg-blue-50 text-blue-700" : "bg-zinc-100 text-zinc-700"}`}>{user.role}</span></td><td>{user.role === UserRole.ADMIN ? "Todas" : user.branches.join(", ") || "—"}</td><td><StatusBadge active={user.active}/></td><td>{user.lastAccessAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(user.lastAccessAt)) : "Nunca"}</td><td><div className="flex gap-2"><button onClick={() => edit(user)} className="grid size-9 place-items-center rounded-lg border border-zinc-200" title="Editar"><Pencil size={16}/></button><button onClick={() => toggleActive(user)} className="grid size-9 place-items-center rounded-lg border border-zinc-200" title={user.active ? "Desativar" : "Reativar"}><Power size={16} className={user.active ? "text-zinc-600" : "text-emerald-600"}/></button></div></td></tr>)}
      {!initialUsers.length && <tr><td colSpan={7} className="py-10 text-center text-zinc-500">Nenhum usuário encontrado.</td></tr>}
    </tbody></table></div></div>

    {open && <div className="fixed inset-0 z-50 flex justify-end bg-black/35"><div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl">
      <div className="mb-6 flex items-start justify-between"><div><h2 className="text-xl font-black">{form.id ? "Editar usuário" : "Novo usuário"}</h2><p className="text-sm text-zinc-500">Controle de acesso por perfil e filial.</p></div><button onClick={() => setOpen(false)}><X/></button></div>
      <form onSubmit={save} className="space-y-4">
        <label className="block"><span className="mb-1.5 block text-sm font-bold">Nome completo</span><input required className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></label>
        <label className="block"><span className="mb-1.5 block text-sm font-bold">E-mail</span><input required type="email" disabled={Boolean(form.id)} className="field disabled:bg-zinc-100" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}/></label>
        {!form.id && <label className="block"><span className="mb-1.5 block text-sm font-bold">Senha inicial</span><input required minLength={8} type="password" className="field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}/><span className="mt-1 block text-xs text-zinc-500">O fluxo de convite por e-mail está planejado para a próxima etapa.</span></label>}
        <label className="block"><span className="mb-1.5 block text-sm font-bold">Perfil</span><select className="field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}><option value="ADMIN">ADMIN</option><option value="MANAGER">MANAGER</option><option value="OPERATOR">OPERATOR</option></select></label>
        {form.role !== UserRole.ADMIN && <fieldset><legend className="mb-2 text-sm font-bold">Filiais</legend><div className="space-y-2 rounded-xl border border-zinc-200 p-3">{branches.map((branch) => <label key={branch.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.branchIds.includes(branch.id)} onChange={() => toggleBranch(branch.id)}/>{branch.name}</label>)}</div></fieldset>}
        <label className="block"><span className="mb-1.5 block text-sm font-bold">Status</span><select className="field" value={form.active ? "active" : "inactive"} onChange={(e) => setForm({ ...form, active: e.target.value === "active" })}><option value="active">Ativo</option><option value="inactive">Inativo</option></select></label>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="flex gap-2 pt-2"><button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancelar</button><button className="btn-primary flex-1" disabled={loading}>{loading ? "Salvando..." : "Salvar usuário"}</button></div>
      </form>
    </div></div>}
  </>;
}
