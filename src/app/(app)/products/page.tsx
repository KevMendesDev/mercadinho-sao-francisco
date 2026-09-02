import Link from "next/link";
import { Package, Search, Tags } from "lucide-react";
import { ProductCreate } from "@/components/products/ProductCreate";
import { ProductEdit } from "@/components/products/ProductEdit";
import { PageSizeSelect } from "@/components/ui/PageSizeSelect";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { getDataSource } from "@/database/data-source";
import { Category, Product, UserRole } from "@/database/entities";
import { requireSession } from "@/lib/auth/session";
import { pagination } from "@/lib/pagination";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ search?: string; page?: string; size?: string }> }) {
  const session = await requireSession(); const params = await searchParams; const search = (params.search ?? "").trim();
  const options = pagination(Number(params.page), Number(params.size)); const db = await getDataSource(); const repo = db.getRepository<Product>("Product");
  const query = repo.createQueryBuilder("product").leftJoinAndSelect("product.category", "category").where("product.active = true").andWhere("product.deleted_at IS NULL");
  if (search) query.andWhere("(product.name ILIKE :search OR product.barcode ILIKE :search OR product.brand ILIKE :search)", { search: `%${search}%` });
  const filteredTotal = await query.getCount();
  const totalPages = Math.max(1, Math.ceil(filteredTotal / options.size)); const currentPage = Math.min(options.page, totalPages);
  const products = await query.orderBy("product.name", "ASC").offset((currentPage - 1) * options.size).limit(options.size).getMany();
  const [totalProducts, totalCategories] = await Promise.all([repo.countBy({ active: true }), db.getRepository<Category>("Category").count()]);
  const urlFor = (targetPage: number) => `/products?${new URLSearchParams({ ...(search ? { search } : {}), page: String(targetPage), size: String(options.size) }).toString()}`;
  return <><PageHeader title="Produtos" subtitle="Cadastro de produtos" action={[UserRole.ADMIN, UserRole.MANAGER].includes(session.role) ? <ProductCreate key="create"/> : null}/>
    <div className="card mb-5 p-4"><form className="flex gap-2" action="/products"><input type="hidden" name="size" value={options.size}/><div className="relative flex-1"><Search className="absolute left-3 top-3.5 text-zinc-500" size={18}/><input name="search" defaultValue={search} className="field pl-10" placeholder="Buscar produto, marca ou código de barras..."/></div><button className="btn-secondary">Buscar</button></form></div>
    <section className="grid gap-4 sm:grid-cols-2"><StatCard icon={Package} label="Total de produtos" value={totalProducts.toLocaleString("pt-BR")}/><StatCard icon={Tags} label="Categorias" value={totalCategories}/></section>
    <div className="card mt-5 overflow-hidden"><div className="table-wrap"><table><thead><tr><th>Produto</th><th>Categoria</th><th>Código de barras</th><th>Peso</th><th>Unidade</th><th>Status</th><th>Ações</th></tr></thead><tbody>
      {products.map((product) => <tr key={product.id}><td><div className="font-bold">{product.name}</div><div className="text-xs text-zinc-500">{product.brand || "—"}</div></td><td>{product.category?.name || "—"}</td><td className="font-mono text-xs">{product.barcode || "—"}</td><td>{product.weight ? Number(product.weight).toLocaleString("pt-BR") : "—"}</td><td>{product.unit}</td><td><StatusBadge active={product.active}/></td><td>{[UserRole.ADMIN, UserRole.MANAGER].includes(session.role) ? <ProductEdit product={{ id: product.id, name: product.name, brand: product.brand, categoryId: product.categoryId, barcode: product.barcode, unit: product.unit as "ML" | "G" | "KG" | "L", weight: product.weight }}/> : "—"}</td></tr>)}
      {!products.length && <tr><td colSpan={7} className="py-10 text-center text-zinc-500">Nenhum produto encontrado.</td></tr>}</tbody></table></div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3 text-sm"><span className="text-zinc-500">{filteredTotal} produto(s) • página {currentPage} de {totalPages}</span><PageSizeSelect value={options.size}/><div className="flex gap-2"><Link aria-disabled={currentPage <= 1} className={`btn-secondary py-2 ${currentPage <= 1 ? "pointer-events-none opacity-40" : ""}`} href={urlFor(Math.max(1, currentPage - 1))}>Anterior</Link><Link aria-disabled={currentPage >= totalPages} className={`btn-secondary py-2 ${currentPage >= totalPages ? "pointer-events-none opacity-40" : ""}`} href={urlFor(Math.min(totalPages, currentPage + 1))}>Próxima</Link></div></div></div>
  </>;
}
