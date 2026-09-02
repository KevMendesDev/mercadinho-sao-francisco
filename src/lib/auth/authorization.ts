import { getDataSource } from "@/database/data-source";
import { Branch, User, UserBranch, UserRole } from "@/database/entities";
import { readSession, SessionData } from "./session";

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}

export async function requireApiUser(roles?: UserRole[]): Promise<{ session: SessionData; user: User }> {
  const session = await readSession();
  if (!session) throw new UnauthorizedError("Sessão inválida.");
  const db = await getDataSource();
  const user = await db.getRepository<User>("User").findOne({ where: { id: session.userId } });
  if (!user || !user.active || user.deletedAt) throw new UnauthorizedError("Usuário inativo ou inexistente.");
  if (roles && !roles.includes(user.role)) throw new ForbiddenError("Sem permissão para esta operação.");
  return { session: { ...session, role: user.role }, user };
}

export async function assertBranchAccess(user: User, branchId: string): Promise<void> {
  const db = await getDataSource();
  const activeBranch = await db.getRepository<Branch>("Branch").existsBy({ id: branchId, active: true });
  if (!activeBranch) throw new ForbiddenError("Filial inválida ou inativa.");
  if (user.role === UserRole.ADMIN) return;
  const access = await db.getRepository<UserBranch>("UserBranch").existsBy({ userId: user.id, branchId });
  if (!access) throw new ForbiddenError("Usuário sem acesso à filial selecionada.");
}
