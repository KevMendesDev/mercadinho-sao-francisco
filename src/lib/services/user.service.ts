import "server-only";
import { hash } from "bcryptjs";
import { Brackets, In } from "typeorm";
import { getDataSource } from "@/database/data-source";
import { Branch, User, UserBranch, UserRole } from "@/database/entities";
import { writeAudit } from "./audit.service";
import { BadRequestError, ConflictError, NotFoundError } from "@/lib/errors";
import { pageForTotal, pageResult, pagination } from "@/lib/pagination";

export type UserFilters = {
  search?: string;
  role?: UserRole;
  active?: boolean;
};

export async function listUsers(
  page?: number,
  size?: number,
  filters: UserFilters = {},
) {
  const db = await getDataSource();
  const options = pagination(page, size);
  const query = db
    .getRepository<User>("users")
    .createQueryBuilder("user")
    .withDeleted()
    .leftJoinAndSelect("user.branchAccesses", "branchAccesses")
    .leftJoinAndSelect("branchAccesses.branch", "branch")
    .orderBy("user.name", "ASC");
  if (filters.search)
    query.andWhere(
      new Brackets((where) =>
        where
          .where("user.name ILIKE :search", { search: `%${filters.search}%` })
          .orWhere("user.email ILIKE :search", {
            search: `%${filters.search}%`,
          }),
      ),
    );
  if (filters.role) query.andWhere("user.role = :role", { role: filters.role });
  if (filters.active !== undefined)
    query.andWhere("user.active = :active", { active: filters.active });
  const totalElements = await query.getCount();
  const currentPage = pageForTotal(options.page, options.size, totalElements);
  const content = await query
    .skip((currentPage - 1) * options.size)
    .take(options.size)
    .getMany();
  return pageResult(content, totalElements, currentPage, options.size);
}

export async function createUser(
  input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    branchIds: string[];
    active: boolean;
  },
  actorId: string,
) {
  const db = await getDataSource();
  return db.transaction(async (manager) => {
    const repo = manager.getRepository<User>("users");
    if (
      await repo.findOne({ where: { email: input.email }, withDeleted: true })
    )
      throw new ConflictError("E-mail já cadastrado.");
    if (
      input.role !== UserRole.ADMIN &&
      (await manager
        .getRepository<Branch>("branches")
        .countBy({ id: In(input.branchIds) })) !== input.branchIds.length
    )
      throw new BadRequestError(
        "Uma ou mais filiais selecionadas não existem.",
      );
    const result = await repo.insert({
      name: input.name,
      email: input.email,
      passwordHash: await hash(input.password, 12),
      role: input.role,
      active: input.active,
      deletedAt: input.active ? null : new Date(),
    });
    const id = result.identifiers[0]?.id;
    if (typeof id !== "string")
      throw new Error("Não foi possível criar o usuário.");
    const user = await repo.findOneByOrFail({ id });
    if (input.role !== UserRole.ADMIN && input.branchIds.length === 0)
      throw new BadRequestError("Selecione ao menos uma filial.");
    if (input.role !== UserRole.ADMIN) {
      await manager
        .getRepository<UserBranch>("user_branches")
        .insert(input.branchIds.map((branchId) => ({ userId: user.id, branchId })));
    }
    await writeAudit(manager, {
      entityType: "User",
      entityId: user.id,
      action: "CREATE",
      userId: actorId,
      metadata: { role: user.role, branchIds: input.branchIds },
    });
    return user;
  });
}

export async function updateUser(
  id: string,
  input: {
    name?: string;
    role?: UserRole;
    branchIds?: string[];
    active?: boolean;
  },
  actorId: string,
) {
  const db = await getDataSource();
  return db.transaction(async (manager) => {
    await manager.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
      "users:active-admin",
    ]);
    const repo = manager.getRepository<User>("users");
    const user = await repo.findOne({ where: { id }, withDeleted: true });
    if (!user) throw new NotFoundError("Usuário não encontrado.");
    if (id === actorId && input.active === false)
      throw new BadRequestError("Você não pode desativar o próprio usuário.");
    if (
      id === actorId &&
      input.role !== undefined &&
      input.role !== UserRole.ADMIN
    )
      throw new BadRequestError(
        "Você não pode remover o próprio perfil de administrador.",
      );
    const removingAdmin =
      user.role === UserRole.ADMIN &&
      (input.active === false ||
        (input.role !== undefined && input.role !== UserRole.ADMIN));
    if (removingAdmin) {
      const activeAdmins = await repo
        .createQueryBuilder("user")
        .where("user.role = :role", { role: UserRole.ADMIN })
        .andWhere("user.active = true")
        .andWhere("user.deleted_at IS NULL")
        .andWhere("user.id <> :id", { id })
        .getCount();
      if (activeAdmins === 0)
        throw new BadRequestError(
          "O sistema precisa manter ao menos um administrador ativo.",
        );
    }
    const changes: Partial<User> = {};
    if (input.name !== undefined) changes.name = input.name;
    if (input.role !== undefined) changes.role = input.role;
    if (input.active !== undefined) {
      changes.active = input.active;
      changes.deletedAt = input.active ? null : new Date();
    }
    if (Object.keys(changes).length) {
      await repo.update(user.id, changes);
      Object.assign(user, changes);
    }

    if (input.branchIds !== undefined || input.role !== undefined) {
      const branchIds = input.branchIds ?? [];
      if (
        user.role !== UserRole.ADMIN &&
        (await manager
          .getRepository<Branch>("branches")
          .countBy({ id: In(branchIds) })) !== branchIds.length
      )
        throw new BadRequestError(
          "Uma ou mais filiais selecionadas não existem.",
        );
      await manager
        .getRepository<UserBranch>("user_branches")
        .delete({ userId: user.id });
      if (user.role !== UserRole.ADMIN) {
        if (branchIds.length === 0)
          throw new BadRequestError(
            "Selecione ao menos uma filial para este perfil.",
          );
        await manager
          .getRepository<UserBranch>("user_branches")
          .insert(branchIds.map((branchId) => ({ userId: user.id, branchId })));
      }
    }
    await writeAudit(manager, {
      entityType: "User",
      entityId: user.id,
      action: user.active ? "UPDATE_OR_REACTIVATE" : "DEACTIVATE",
      userId: actorId,
      metadata: input,
    });
    return user;
  });
}
