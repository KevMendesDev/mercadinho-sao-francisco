import { ILike } from "typeorm";
import { getDataSource } from "@/database/data-source";
import { Category, Product } from "@/database/entities";
import { writeAudit } from "./audit.service";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { pageForTotal, pageResult, pagination } from "@/lib/pagination";

export async function listCategories() {
  const db = await getDataSource();
  return db.getRepository<Category>("Category").find({ order: { name: "ASC" } });
}

export async function listCategoriesPage(page?: number, size?: number) {
  const db = await getDataSource();
  const options = pagination(page, size);
  const categoryRepo = db.getRepository<Category>("Category");
  const totalElements = await categoryRepo.count();
  const currentPage = pageForTotal(options.page, options.size, totalElements);
  const categories = await categoryRepo.find({ order: { name: "ASC" }, skip: (currentPage - 1) * options.size, take: options.size });
  const usageRows = categories.length ? await db.getRepository<Product>("Product").createQueryBuilder("product")
    .select("product.category_id", "categoryId").addSelect("COUNT(*)", "count")
    .where("product.category_id IN (:...ids)", { ids: categories.map((category) => category.id) })
    .groupBy("product.category_id").getRawMany<{ categoryId: string; count: string }>() : [];
  const usage = new Map(usageRows.map((row) => [row.categoryId, Number(row.count)]));
  return pageResult(categories.map((category) => ({ ...category, usageCount: usage.get(category.id) ?? 0 })), totalElements, currentPage, options.size);
}

export async function createCategory(name: string, userId: string) {
  const db = await getDataSource();
  return db.transaction(async (manager) => {
    const repo = manager.getRepository<Category>("Category");
    if (await repo.exists({ where: { name: ILike(name) } })) throw new ConflictError("Categoria já cadastrada.");
    const category = await repo.save(repo.create({ name }));
    await writeAudit(manager, { entityType: "Category", entityId: category.id, action: "CREATE", userId, metadata: { name: category.name } });
    return category;
  });
}

export async function updateCategory(id: string, name: string, userId: string) {
  const db = await getDataSource();
  return db.transaction(async (manager) => {
    const repo = manager.getRepository<Category>("Category");
    const category = await repo.findOneBy({ id });
    if (!category) throw new NotFoundError("Categoria não encontrada.");
    const duplicate = await repo.createQueryBuilder("category").where("LOWER(category.name) = LOWER(:name)", { name }).andWhere("category.id <> :id", { id }).getOne();
    if (duplicate) throw new ConflictError("Categoria já cadastrada.");
    category.name = name;
    const updated = await repo.save(category);
    await writeAudit(manager, { entityType: "Category", entityId: updated.id, action: "UPDATE", userId, metadata: { name: updated.name } });
    return updated;
  });
}

export async function deleteCategory(id: string, userId: string) {
  const db = await getDataSource();
  return db.transaction(async (manager) => {
    const categoryRepo = manager.getRepository<Category>("Category");
    const category = await categoryRepo.findOneBy({ id });
    if (!category) throw new NotFoundError("Categoria não encontrada.");
    if (await manager.getRepository<Product>("Product").existsBy({ categoryId: id })) throw new ConflictError("Categoria já está sendo utilizada.");
    await categoryRepo.remove(category);
    await writeAudit(manager, { entityType: "Category", entityId: id, action: "DELETE", userId, metadata: { name: category.name } });
  });
}
