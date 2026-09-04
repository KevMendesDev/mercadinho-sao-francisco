import "server-only";
import { getDataSource } from "@/database/data-source";
import { Branch, User, UserBranch, UserRole } from "@/database/entities";
import { destroySession, readSession, SessionData } from "./session";

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}

export async function requireApiUser(
  roles?: UserRole[],
): Promise<{ session: SessionData; user: User }> {
  const session = await readSession();
  if (!session) {
    await destroySession();
    throw new UnauthorizedError("Sessão inválida.");
  }
  const db = await getDataSource();
  const user = await db
    .getRepository<User>("users")
    .findOne({ where: { id: session.userId } });
  if (!user || !user.active || user.deletedAt) {
    await destroySession();
    throw new UnauthorizedError("Usuário inativo ou inexistente.");
  }
  await assertBranchAccess(user, session.branchId).catch(async () => {
    await destroySession();
    throw new UnauthorizedError("Sessão sem acesso à filial selecionada.");
  });
  if (roles && !roles.includes(user.role))
    throw new ForbiddenError("Sem permissão para esta operação.");
  return { session: { ...session, role: user.role }, user };
}

export async function assertBranchAccess(
  user: User,
  branchId: string,
): Promise<void> {
  const db = await getDataSource();
  const activeBranch = await db
    .getRepository<Branch>("branches")
    .existsBy({ id: branchId, active: true });
  if (!activeBranch) throw new ForbiddenError("Filial inválida ou inativa.");
  if (user.role === UserRole.ADMIN) return;
  const access = await db
    .getRepository<UserBranch>("user_branches")
    .existsBy({ userId: user.id, branchId });
  if (!access)
    throw new ForbiddenError("Usuário sem acesso à filial selecionada.");
}
