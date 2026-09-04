"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Boxes,
  ChartNoAxesCombined,
  Gauge,
  Package,
  Settings,
  Tags,
  Users,
  ArrowLeftRight,
  Menu,
  X,
} from "lucide-react";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleItems = items.filter(
    (item) =>
      (!item.adminOnly || role === UserRole.ADMIN) &&
      (!item.manageOnly || [UserRole.ADMIN, UserRole.MANAGER].includes(role)),
  );
  const navigation = (
    <nav className="mt-4 space-y-1">
      {visibleItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            onClick={() => setMobileOpen(false)}
            key={href}
            href={href}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${active ? "bg-[#ffcc00] text-black" : "text-zinc-200 hover:bg-zinc-900"}`}
          >
            <Icon size={20} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
  return (
    <>
      <aside className="hidden w-[250px] shrink-0 bg-[#070707] px-3 py-5 text-white lg:block">
        <div className="border-b border-zinc-800 px-3 pb-5">
          <Brand compact inverse />
        </div>
        {navigation}
      </aside>
      <button
        type="button"
        aria-label="Abrir menu"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-3 z-40 grid size-10 place-items-center rounded-lg border border-zinc-200 bg-white shadow-sm lg:hidden"
      >
        <Menu size={20} />
      </button>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="h-full w-[min(82vw,280px)] bg-[#070707] px-3 py-5 text-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 px-3 pb-5">
              <Brand compact inverse />
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMobileOpen(false)}
                className="grid size-9 place-items-center rounded-lg text-zinc-300 hover:bg-zinc-900"
              >
                <X size={20} />
              </button>
            </div>
            {navigation}
          </aside>
        </div>
      )}
    </>
  );
}
