"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Building2, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/client-api";

type BranchOption = { id: string; name: string };

export function LoginForm() {
  const router = useRouter();
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    requestJson<{ content: BranchOption[] }>("/api/branches?size=100", {}, "Não foi possível carregar as filiais.").then(({ content }) => setBranches(content)).catch((reason: Error) => setError(reason.message));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      await requestJson("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password"), branchId: form.get("branchId") }) }, "Não foi possível entrar.");
      router.replace("/dashboard"); router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível entrar.");
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="block"><span className="mb-2 block text-sm font-bold">E-mail</span><div className="relative"><Mail className="absolute left-3 top-3.5 text-zinc-500" size={19}/><input name="email" type="email" required maxLength={190} autoComplete="email" className="field pl-10" placeholder="seu@email.com" /></div></label>
      <label className="block"><span className="mb-2 block text-sm font-bold">Senha</span><div className="relative"><LockKeyhole className="absolute left-3 top-3.5 text-zinc-500" size={19}/><input name="password" type={showPassword ? "text" : "password"} required minLength={8} maxLength={128} autoComplete="current-password" className="field px-10" placeholder="••••••••" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-3.5 text-zinc-500" aria-label="Mostrar senha">{showPassword ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div></label>
      <label className="block"><span className="mb-2 block text-sm font-bold">Filial</span><div className="relative"><Building2 className="absolute left-3 top-3.5 text-zinc-500" size={19}/><select name="branchId" required className="field pl-10"><option value="">Selecione a filial</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></div></label>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <button className="btn-primary w-full py-3.5 text-base" disabled={loading}>{loading ? "Entrando..." : "Entrar"}<ArrowRight size={20}/></button>
    </form>
  );
}
