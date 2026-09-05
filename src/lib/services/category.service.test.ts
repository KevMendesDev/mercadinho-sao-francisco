import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDataSource, writeAudit } = vi.hoisted(() => ({ getDataSource: vi.fn(), writeAudit: vi.fn() }));

vi.mock("@/database/data-source", () => ({ getDataSource }));
vi.mock("./audit.service", () => ({ writeAudit }));

import { deleteCategory } from "./category.service";

describe("deleteCategory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("desvincula produtos excluídos antes de excluir a categoria", async () => {
    const category = { id: "category-1", name: "Mercearia" };
    const product = { id: "product-1", categoryId: "category-1", deletedAt: new Date() };
    const productRepo = { find: vi.fn().mockResolvedValue([product]), update: vi.fn().mockResolvedValue(undefined) };
    const categoryRepo = { findOneBy: vi.fn().mockResolvedValue(category), remove: vi.fn().mockResolvedValue(category) };
    const manager = { getRepository: (entity: string) => entity === "categories" ? categoryRepo : productRepo };
    getDataSource.mockResolvedValue({ transaction: async (callback: (value: typeof manager) => Promise<void>) => callback(manager) });

    await deleteCategory("category-1", "user-1");

    expect(productRepo.update).toHaveBeenCalledWith("product-1", { categoryId: null });
    expect(categoryRepo.remove).toHaveBeenCalledWith(category);
  });

  it("impede exclusão quando há produto ativo vinculado", async () => {
    const categoryRepo = { findOneBy: vi.fn().mockResolvedValue({ id: "category-1" }) };
    const productRepo = { find: vi.fn().mockResolvedValue([{ id: "product-1", deletedAt: null }]) };
    const manager = { getRepository: (entity: string) => entity === "categories" ? categoryRepo : productRepo };
    getDataSource.mockResolvedValue({ transaction: async (callback: (value: typeof manager) => Promise<void>) => callback(manager) });

    await expect(deleteCategory("category-1", "user-1")).rejects.toMatchObject({ message: "Categoria já está sendo utilizada." });
  });
});
