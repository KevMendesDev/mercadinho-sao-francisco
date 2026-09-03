"use client";

import { FormEvent, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/client-api";

type CategoryRow = { id: string; name: string; usageCount: number; createdAt: Date };

export function CategoryManagement({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter(); const [editing, setEditing] = useState<CategoryRow | null>(null); const [name, setName] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  function openEdit(category: CategoryRow) { setEditing(category); setName(category.name); setError(""); }
  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editing) return; setLoading(true); setError("");
    try {
      await requestJson(`/api/categories/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) }, "Erro ao atualizar categoria.");
      setEditing(null); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Erro ao atualizar categoria."); } finally { setLoading(false); }
  }
  async function remove(category: CategoryRow) {
    if (!window.confirm(`Excluir a categoria “${category.name}”?`)) return;
    try { await requestJson(`/api/categories/${category.id}`, { method: "DELETE" }, "Erro ao excluir categoria."); router.refresh(); }
    catch (reason) { window.alert(reason instanceof Error ? reason.message : "Erro ao excluir categoria."); }
  }
  return <><div className="card overflow-hidden"><div className="table-wrap"><table><thead><tr><th>Categoria</th><th>Produtos vinculados</th><th>Cadastrada em</th><th>Ações</th></tr></thead><tbody>{categories.map((category) => <tr key={category.id}><td className="font-bold">{category.name}</td><td>{category.usageCount}</td><td>{new Intl.DateTimeFormat("pt-BR").format(new Date(category.createdAt))}</td><td><div className="flex gap-2"><button className="btn-secondary px-3 py-2" onClick={() => openEdit(category)}><Pencil size={16}/>Editar</button>{category.usageCount > 0 ? <span title="A categoria já está sendo utilizada" className="inline-flex cursor-not-allowed"><button disabled className="btn-secondary px-3 py-2 opacity-40"><Trash2 size={16}/>Excluir</button></span> : <button className="btn-secondary px-3 py-2 text-red-700" onClick={() => void remove(category)}><Trash2 size={16}/>Excluir</button>}</div></td></tr>)}{!categories.length && <tr><td colSpan={4} className="py-10 text-center text-zinc-500">Nenhuma categoria cadastrada.</td></tr>}</tbody></table></div></div>
    {editing && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4"><div className="card w-full max-w-md p-6"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-xl font-black">Editar categoria</h2><button type="button" onClick={() => setEditing(null)} aria-label="Fechar" className="grid size-10 shrink-0 place-items-center rounded-lg hover:bg-zinc-100"><X/></button></div><form onSubmit={update} className="space-y-4"><label><span className="mb-1.5 block text-sm font-bold">Nome *</span><input required autoFocus className="field" value={name} onChange={(event) => setName(event.target.value)}/></label>{error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancelar</button><button className="btn-primary" disabled={loading}>{loading ? "Salvando..." : "Salvar alterações"}</button></div></form></div></div>}
  </>;
}
