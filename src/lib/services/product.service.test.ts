import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDataSource, writeAudit } = vi.hoisted(() => ({ getDataSource: vi.fn(), writeAudit: vi.fn() }));

vi.mock("@/database/data-source", () => ({ getDataSource }));
vi.mock("./audit.service", () => ({ writeAudit }));

import { deleteProduct } from "./product.service";

describe("deleteProduct", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exclui produto sem estoque e registra auditoria", async () => {
    const product = { id: "product-1", name: "Arroz", categoryId: "category-1" };
    const update = vi.fn().mockResolvedValue(undefined);
    const softDelete = vi.fn().mockResolvedValue(undefined);
    const manager = {
      getRepository: (entity: string) => entity === "products"
        ? { findOneBy: vi.fn().mockResolvedValue(product), update, softDelete }
        : { existsBy: vi.fn().mockResolvedValue(false) },
    };
    getDataSource.mockResolvedValue({ transaction: async (callback: (value: typeof manager) => Promise<void>) => callback(manager) });

    await deleteProduct("product-1", "user-1");

    expect(update).toHaveBeenCalledWith("product-1", { categoryId: null });
    expect(softDelete).toHaveBeenCalledWith("product-1");
    expect(writeAudit).toHaveBeenCalledWith(manager, expect.objectContaining({ entityId: "product-1", action: "DELETE" }));
  });

  it("impede exclusão de produto com estoque", async () => {
    const manager = {
      getRepository: (entity: string) => entity === "products"
        ? { findOneBy: vi.fn().mockResolvedValue({ id: "product-1", name: "Arroz" }) }
        : { existsBy: vi.fn().mockResolvedValue(true) },
    };
    getDataSource.mockResolvedValue({ transaction: async (callback: (value: typeof manager) => Promise<void>) => callback(manager) });

    await expect(deleteProduct("product-1", "user-1")).rejects.toMatchObject({
      message: "Produto não pode ser excluído porque possui estoque.",
    });
    expect(writeAudit).not.toHaveBeenCalled();
  });
});
