import { ILike } from "typeorm";
import { getDataSource } from "@/database/data-source";
import { Category, Product } from "@/database/entities";
import { writeAudit } from "./audit.service";
import { pageForTotal, pageResult, pagination } from "@/lib/pagination";
import { ConflictError, NotFoundError } from "@/lib/errors";

export type ProductInput = {
  name: string;
  brand?: string | null;
  categoryId?: string | null;
  barcode?: string | null;
  unit: string;
  weight?: number | null;
};

export async function listProducts(search = "", page?: number, size?: number) {
  const db = await getDataSource();
  const options = pagination(page, size);
  const repo = db.getRepository<Product>("products");
  const where = search ? [
    { name: ILike(`%${search}%`), active: true },
    { barcode: ILike(`%${search}%`), active: true },
    { brand: ILike(`%${search}%`), active: true },
  ] : { active: true };
  const totalElements = await repo.count({ where });
  const currentPage = pageForTotal(options.page, options.size, totalElements);
  const content = await repo.find({ where, relations: { category: true }, order: { name: "ASC" }, skip: (currentPage - 1) * options.size, take: options.size });
  return pageResult(content, totalElements, currentPage, options.size);
}

export async function createProduct(input: ProductInput, userId: string): Promise<Product> {
  const db = await getDataSource();
  return db.transaction(async (manager) => {
    const repo = manager.getRepository<Product>("products");
    if (input.barcode && await repo.existsBy({ barcode: input.barcode })) throw new ConflictError("Código de barras já cadastrado.");
    if (input.categoryId && !(await manager.getRepository<Category>("categories").existsBy({ id: input.categoryId }))) throw new NotFoundError("Categoria não encontrada.");
    const product = await repo.save(repo.create({ ...input, categoryId: input.categoryId || null, barcode: input.barcode || null, weight: input.weight == null ? null : input.weight.toFixed(3) }));
    await writeAudit(manager, { entityType: "Product", entityId: product.id, action: "CREATE", userId, metadata: { barcode: product.barcode } });
    return product;
  });
}

export async function updateProduct(id: string, input: ProductInput, userId: string): Promise<Product> {
  const db = await getDataSource();
  return db.transaction(async (manager) => {
    const repo = manager.getRepository<Product>("products");
    const product = await repo.findOneBy({ id });
    if (!product) throw new NotFoundError("Produto não encontrado.");
    if (input.barcode) {
      const duplicate = await repo.findOneBy({ barcode: input.barcode });
      if (duplicate && duplicate.id !== id) throw new ConflictError("Código de barras já cadastrado.");
    }
    if (input.categoryId && !(await manager.getRepository<Category>("categories").existsBy({ id: input.categoryId }))) throw new NotFoundError("Categoria não encontrada.");
    Object.assign(product, { ...input, categoryId: input.categoryId || null, barcode: input.barcode || null, weight: input.weight == null ? null : input.weight.toFixed(3) });
    const updated = await repo.save(product);
    await writeAudit(manager, { entityType: "Product", entityId: updated.id, action: "UPDATE", userId, metadata: { barcode: updated.barcode } });
    return updated;
  });
}

export async function findProductByBarcode(barcode: string): Promise<Product | null> {
  const db = await getDataSource();
  return db.getRepository<Product>("products").findOneBy({ barcode, active: true });
}

type OffProduct = { product?: { product_name?: string; brands?: string; categories?: string; quantity?: string } };

export async function lookupBarcode(barcode: string) {
  const local = await findProductByBarcode(barcode);
  if (local) return { source: "LOCAL" as const, product: local };

  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`, {
      headers: { "User-Agent": process.env.OPEN_FOOD_FACTS_USER_AGENT ?? "MercadinhoSaoFrancisco/0.1" },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      if (response.status === 429 || response.status >= 500) return { source: "EXTERNAL_UNAVAILABLE" as const, product: null };
      return { source: "NOT_FOUND" as const, product: null };
    }
    const data = await response.json() as OffProduct;
    if (!data.product?.product_name) return { source: "NOT_FOUND" as const, product: null };
    return {
      source: "OPEN_FOOD_FACTS" as const,
      product: {
        barcode,
        name: data.product.product_name,
        brand: data.product.brands?.split(",")[0]?.trim() || null,
        unit: "G",
      },
    };
  } catch {
    // A consulta externa é apenas um preenchimento opcional. O cadastro manual
    // deve continuar disponível se o Open Food Facts estiver indisponível.
    return { source: "EXTERNAL_UNAVAILABLE" as const, product: null };
  }
}
