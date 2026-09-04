import { compare } from "bcryptjs";
import { getDataSource } from "@/database/data-source";
import { Branch, User, UserBranch, UserRole } from "@/database/entities";
import { createSession } from "@/lib/auth/session";
import { AuthenticationError, BadRequestError, ForbiddenError } from "@/lib/errors";
import { clearLoginAttempts, consumeLoginAttempt } from "./login-rate-limit.service";

const DUMMY_PASSWORD_HASH = "$2b$12$Qqv5D.bvd21xzlr2IHdCquJ7hdH4eWdlKWDJ1N8BqLrV6xA9yO3gG";

export async function authenticate(email: string, password: string, branchId: string): Promise<void> {
  const db = await getDataSource();
  await consumeLoginAttempt(email);
  const user = await db.getRepository<User>("users").findOne({ where: { email }, withDeleted: true });
  const passwordMatches = await compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!user || !user.active || user.deletedAt || !passwordMatches) {
    throw new AuthenticationError();
  }
  await clearLoginAttempts(email);
  const branch = await db.getRepository<Branch>("branches").findOneBy({ id: branchId, active: true });
  if (!branch) throw new BadRequestError("Filial selecionada não está disponível.");
  if (user.role !== UserRole.ADMIN) {
    const hasAccess = await db.getRepository<UserBranch>("user_branches").existsBy({ userId: user.id, branchId });
    if (!hasAccess) throw new ForbiddenError("Usuário sem acesso a esta filial.");
  }
  await db.getRepository<User>("users").update(user.id, { lastAccessAt: new Date() });
  await createSession({ userId: user.id, name: user.name, email: user.email, role: user.role, branchId });
}
