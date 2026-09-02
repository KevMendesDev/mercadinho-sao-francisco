import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDataSource, writeAudit } = vi.hoisted(() => ({ getDataSource: vi.fn(), writeAudit: vi.fn() }));

vi.mock("@/database/data-source", () => ({ getDataSource }));
vi.mock("./audit.service", () => ({ writeAudit }));

import { removeStockFefo } from "./stock.service";

describe("removeStockFefo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("baixa lotes pela validade mais próxima e registra cada movimento", async () => {
    const batches = [
      { id: "batch-1", productId: "product-1", branchId: "branch-1", quantity: 2, expirationDate: "2026-01-01", createdAt: new Date("2025-01-01") },
      { id: "batch-2", productId: "product-1", branchId: "branch-1", quantity: 5, expirationDate: "2026-02-01", createdAt: new Date("2025-01-02") },
    ];
    const savedBatches: typeof batches = [];
    const savedMovements: Array<Record<string, unknown>> = [];
    const query = { setLock: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), andWhere: vi.fn().mockReturnThis(), orderBy: vi.fn().mockReturnThis(), addOrderBy: vi.fn().mockReturnThis(), getMany: vi.fn().mockResolvedValue(batches) };
    const manager = {
      getRepository: (entity: { name: string } | string) => (entity === "StockBatch" || (typeof entity !== "string" && entity.name === "StockBatch"))
        ? { createQueryBuilder: () => query, save: async (batch: typeof batches[number]) => { savedBatches.push({ ...batch }); return batch; } }
        : { create: (value: Record<string, unknown>) => value, save: async (movement: Record<string, unknown>) => { savedMovements.push(movement); return { id: String(savedMovements.length) }; } },
    };
    getDataSource.mockResolvedValue({ transaction: async (callback: (value: typeof manager) => Promise<void>) => callback(manager) });

    await removeStockFefo({ productId: "product-1", branchId: "branch-1", quantity: 4, reason: "Venda", userId: "user-1" });

    expect(savedBatches.map((batch) => batch.quantity)).toEqual([0, 3]);
    expect(savedMovements.map((movement) => movement.quantity)).toEqual([2, 2]);
    expect(writeAudit).toHaveBeenCalledOnce();
  });

  it("rejeita saída maior que o saldo sem alterar lotes", async () => {
    const query = { setLock: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), andWhere: vi.fn().mockReturnThis(), orderBy: vi.fn().mockReturnThis(), addOrderBy: vi.fn().mockReturnThis(), getMany: vi.fn().mockResolvedValue([{ quantity: 2 }]) };
    const manager = { getRepository: () => ({ createQueryBuilder: () => query }) };
    getDataSource.mockResolvedValue({ transaction: async (callback: (value: typeof manager) => Promise<void>) => callback(manager) });

    await expect(removeStockFefo({ productId: "product-1", branchId: "branch-1", quantity: 3, reason: "Venda", userId: "user-1" })).rejects.toMatchObject({ message: "Estoque insuficiente. Disponível: 2." });
    expect(writeAudit).not.toHaveBeenCalled();
  });
});
