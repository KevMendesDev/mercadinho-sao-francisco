import { CategoryCreate } from "@/components/categories/CategoryCreate";
import { CategoryManagement } from "@/components/categories/CategoryManagement";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageNavigation } from "@/components/ui/PageNavigation";
import { UserRole } from "@/database/entities";
import { requireSession } from "@/lib/auth/session";
import { listCategoriesPage } from "@/lib/services/category.service";

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ page?: string; size?: string }> }) {
  await requireSession([UserRole.ADMIN, UserRole.MANAGER]);
  const { page, size } = await searchParams; const categories = await listCategoriesPage(Number(page), Number(size));
  return <><PageHeader title="Categorias" subtitle="Gerenciamento das categorias de produtos" action={<CategoryCreate/>}/><CategoryManagement categories={categories.content}/><div className="mt-4 card"><PageNavigation pathname="/categories" page={categories.page} totalPages={categories.totalPages} totalElements={categories.totalElements} size={categories.size} itemLabel="categoria"/></div></>;
}
