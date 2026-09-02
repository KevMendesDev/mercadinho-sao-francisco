import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getDataSource } from "@/database/data-source";
import { Branch, UserBranch, UserRole } from "@/database/entities";
import { requireSession } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const db = await getDataSource();
  let branches: { id: string; name: string }[];
  if (session.role === UserRole.ADMIN) {
    branches = (await db.getRepository<Branch>("Branch").find({ where: { active: true }, order: { name: "ASC" }, select: { id: true, name: true } })).map((branch) => ({ id: branch.id, name: branch.name }));
  } else {
    const accesses = await db.getRepository<UserBranch>("UserBranch").find({ where: { userId: session.userId }, relations: { branch: true } });
    branches = accesses.filter((access) => access.branch.active).map((access) => ({ id: access.branch.id, name: access.branch.name }));
  }
  return (
    <div className="flex min-h-screen bg-[#f7f8fa]">
      <Sidebar role={session.role}/>
      <div className="min-w-0 flex-1"><Topbar name={session.name} branchId={session.branchId} branches={branches}/><main className="mx-auto max-w-[1500px] p-4 md:p-7">{children}</main></div>
    </div>
  );
}
