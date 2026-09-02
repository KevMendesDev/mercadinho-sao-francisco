import { UserManagement } from "@/components/users/UserManagement";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageNavigation } from "@/components/ui/PageNavigation";
import { getDataSource } from "@/database/data-source";
import { Branch, UserRole } from "@/database/entities";
import { requireSession } from "@/lib/auth/session";
import { listUsers } from "@/lib/services/user.service";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ page?: string; size?: string; search?: string; role?: string; status?: string }> }) {
  await requireSession([UserRole.ADMIN]); const { page, size, search: rawSearch, role: rawRole, status: rawStatus } = await searchParams; const db = await getDataSource();
  const search = rawSearch?.trim() ?? ""; const role = Object.values(UserRole).includes(rawRole as UserRole) ? rawRole as UserRole : undefined; const status = rawStatus === "ACTIVE" ? true : rawStatus === "INACTIVE" ? false : undefined;
  const [users, branches] = await Promise.all([listUsers(Number(page), Number(size), { search, role, active: status }), db.getRepository<Branch>("Branch").find({ where: { active: true }, order: { name: "ASC" }, select: { id: true, name: true } })]);
  const rows = users.content.map((user) => ({ id: user.id, name: user.name, email: user.email, role: user.role, active: user.active && !user.deletedAt, lastAccessAt: user.lastAccessAt?.toISOString() ?? null, branchIds: user.branchAccesses.map((access) => access.branchId), branches: user.branchAccesses.map((access) => access.branch.name) }));
  const branchOptions = branches.map((branch) => ({ id: branch.id, name: branch.name }));
  const filters = { search, role: role ?? "ALL", status: rawStatus === "ACTIVE" || rawStatus === "INACTIVE" ? rawStatus : "ALL" };
  const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== "" && value !== "ALL"));
  return <><PageHeader title="Usuários" subtitle="Gerenciamento de acessos"/><UserManagement initialUsers={rows} branches={branchOptions} filters={filters}/><div className="mt-4 card"><PageNavigation pathname="/users" page={users.page} totalPages={users.totalPages} totalElements={users.totalElements} size={users.size} itemLabel="usuário" params={params}/></div></>;
}
