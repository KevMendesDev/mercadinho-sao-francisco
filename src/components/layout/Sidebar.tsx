"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, ChartNoAxesCombined, Gauge, Package, Settings, Tags, Users, ArrowLeftRight } from "lucide-react";
import { Brand } from "@/components/ui/Brand";
import { UserRole } from "@/database/entities/enums";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/products", label: "Produtos", icon: Package },
  { href: "/categories", label: "Categorias", icon: Tags, manageOnly: true },
  { href: "/stock", label: "Estoque", icon: Boxes },
  { href: "/movements", label: "Movimentações", icon: ArrowLeftRight },
  { href: "/users", label: "Usuários", icon: Users, adminOnly: true },
  { href: "/reports", label: "Relatórios", icon: ChartNoAxesCombined },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-[250px] shrink-0 bg-[#070707] px-3 py-5 text-white lg:block">
      <div className="border-b border-zinc-800 px-3 pb-5"><Brand compact inverse /></div>
      <nav className="mt-4 space-y-1">
        {items.filter((item) => (!item.adminOnly || role === UserRole.ADMIN) && (!item.manageOnly || [UserRole.ADMIN, UserRole.MANAGER].includes(role))).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return <Link key={href} href={href} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${active ? "bg-[#ffcc00] text-black" : "text-zinc-200 hover:bg-zinc-900"}`}><Icon size={20}/>{label}</Link>;
        })}
      </nav>
    </aside>
  );
}
