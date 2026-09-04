import "server-only";
import { EntityManager, MoreThan } from "typeorm";
import { getDataSource } from "@/database/data-source";
import {
  MovementSource,
  Product,
  StockBatch,
  StockMovement,
  StockMovementType,
} from "@/database/entities";
import { writeAudit } from "./audit.service";
import { pageForTotal, pageResult, pagination } from "@/lib/pagination";
import { BadRequestError, NotFoundError } from "@/lib/errors";

async function saveMovement(
  manager: EntityManager,
  input: {
    productId: string;
    branchId: string;
    batchId?: string | null;
    type: StockMovementType;
    quantity: number;
    source?: MovementSource;
    reason?: string | null;
    referenceId?: string | null;
    userId?: string | null;
  },
) {
  const result = await manager.getRepository<StockMovement>("stock_movements").insert({
    productId: input.productId,
    branchId: input.branchId,
    batchId: input.batchId ?? null,
    type: input.type,
    quantity: input.quantity,
    source: input.source ?? MovementSource.MANUAL,
    reason: input.reason ?? null,
    referenceId: input.referenceId ?? null,
    userId: input.userId ?? null,
  });
  const id = result.identifiers[0]?.id;
  if (typeof id !== "string") throw new Error("Não foi possível criar a movimentação de estoque.");
  return { id };
}

export async function addStockEntry(input: {
  productId: string;
  branchId: string;
  quantity: number;
  expirationDate: string;
  unitCost?: number | null;
  reason?: string | null;
  userId: string;
  source?: MovementSource;
}) {
  const db = await getDataSource();
  return db.transaction(async (manager) => {
    if (
      !(await manager
        .getRepository<Product>("products")
        .existsBy({ id: input.productId, active: true }))
    )
      throw new BadRequestError("Produto não encontrado ou inativo.");
    const batchResult = await manager.getRepository<StockBatch>("stock_batches").insert({
      productId: input.productId,
      branchId: input.branchId,
      quantity: input.quantity,
      expirationDate: input.expirationDate,
      unitCost: input.unitCost == null ? null : input.unitCost.toFixed(2),
      createdByUserId: input.userId,
    });
    const batchId = batchResult.identifiers[0]?.id;
    if (typeof batchId !== "string") throw new Error("Não foi possível criar o lote de estoque.");
    const movement = await saveMovement(manager, {
      productId: input.productId,
      branchId: input.branchId,
      batchId,
      type: StockMovementType.ENTRY,
      quantity: input.quantity,
      reason: input.reason,
      userId: input.userId,
      source: input.source,
    });
    await writeAudit(manager, {
      entityType: "StockBatch",
      entityId: batchId,
      action: "ENTRY",
      userId: input.userId,
      metadata: { quantity: input.quantity, movementId: movement.id },
    });
    return { id: batchId };
  });
}

export async function removeStockFefo(input: {
  productId: string;
  branchId: string;
  quantity: number;
  reason: string;
  userId: string;
  source?: MovementSource;
  referenceId?: string | null;
}) {
  const db = await getDataSource();
  return db.transaction(async (manager) => {
    const batches = await manager
      .getRepository<StockBatch>("stock_batches")
      .createQueryBuilder("batch")
      .setLock("pessimistic_write")
      .where("batch.product_id = :productId", { productId: input.productId })
      .andWhere("batch.branch_id = :branchId", { branchId: input.branchId })
      .andWhere("batch.quantity > 0")
      .orderBy("batch.expiration_date", "ASC")
      .addOrderBy("batch.created_at", "ASC")
      .getMany();
    const total = batches.reduce((sum, batch) => sum + batch.quantity, 0);
    if (total < input.quantity)
      throw new BadRequestError(`Estoque insuficiente. Disponível: ${total}.`);

    let remaining = input.quantity;
    for (const batch of batches) {
      if (remaining === 0) break;
      const used = Math.min(batch.quantity, remaining);
      batch.quantity -= used;
      await manager.getRepository<StockBatch>("stock_batches").update(batch.id, { quantity: batch.quantity });
      await saveMovement(manager, {
        productId: input.productId,
        branchId: input.branchId,
        batchId: batch.id,
        type: StockMovementType.EXIT,
        quantity: used,
        reason: input.reason,
        userId: input.userId,
        source: input.source,
        referenceId: input.referenceId,
      });
      remaining -= used;
    }
    await writeAudit(manager, {
      entityType: "Product",
      entityId: input.productId,
      action: "STOCK_EXIT",
      userId: input.userId,
      metadata: { quantity: input.quantity, branchId: input.branchId },
    });
  });
}

export async function adjustBatch(input: {
  batchId: string;
  newQuantity: number;
  reason: string;
  userId: string;
}) {
  const db = await getDataSource();
  return db.transaction(async (manager) => {
    const batch = await manager
      .getRepository<StockBatch>("stock_batches")
      .createQueryBuilder("batch")
      .setLock("pessimistic_write")
      .where("batch.id = :id", { id: input.batchId })
      .getOne();
    if (!batch) throw new NotFoundError("Lote não encontrado.");
    const previous = batch.quantity;
    const delta = input.newQuantity - previous;
    if (delta === 0) return batch;
    batch.quantity = input.newQuantity;
    await manager.getRepository<StockBatch>("stock_batches").update(batch.id, { quantity: batch.quantity });
    await saveMovement(manager, {
      productId: batch.productId,
      branchId: batch.branchId,
      batchId: batch.id,
      type: StockMovementType.ADJUSTMENT,
      quantity: delta,
      reason: input.reason,
      userId: input.userId,
    });
    await writeAudit(manager, {
      entityType: "StockBatch",
      entityId: batch.id,
      action: "ADJUSTMENT",
      userId: input.userId,
      metadata: {
        previous,
        current: input.newQuantity,
        delta,
        reason: input.reason,
      },
    });
    return batch;
  });
}

export async function listStock(
  branchId: string,
  page?: number,
  size?: number,
) {
  const db = await getDataSource();
  const options = pagination(page, size);
  const repo = db.getRepository<StockBatch>("stock_batches");
  const where = { branchId, quantity: MoreThan(0) };
  const totalElements = await repo.count({ where });
  const currentPage = pageForTotal(options.page, options.size, totalElements);
  const content = await repo.find({
    where,
    relations: { product: true },
    order: { expirationDate: "ASC", createdAt: "ASC" },
    skip: (currentPage - 1) * options.size,
    take: options.size,
  });
  return pageResult(content, totalElements, currentPage, options.size);
}

export async function listMovements(
  branchId: string,
  page?: number,
  size?: number,
) {
  const db = await getDataSource();
  const options = pagination(page, size);
  const repo = db.getRepository<StockMovement>("stock_movements");
  const totalElements = await repo.count({ where: { branchId } });
  const currentPage = pageForTotal(options.page, options.size, totalElements);
  const content = await repo.find({
    where: { branchId },
    relations: { product: true, user: true, batch: true },
    order: { createdAt: "DESC" },
    skip: (currentPage - 1) * options.size,
    take: options.size,
  });
  return pageResult(content, totalElements, currentPage, options.size);
}
