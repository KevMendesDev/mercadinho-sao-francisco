import "server-only";
import { getDataSource } from "@/database/data-source";
import { Product, StockBatch, StockMovement } from "@/database/entities";
import { addDaysToDate, businessDate } from "@/lib/date";

export async function getDashboard(branchId: string) {
  const db = await getDataSource();
  const productRepo = db.getRepository<Product>("products");
  const batchRepo = db.getRepository<StockBatch>("stock_batches");
  const movementRepo = db.getRepository<StockMovement>("stock_movements");
  const date = businessDate();
  const soonDate = addDaysToDate(date, 30);

  const [products, stockRaw, expiring, expired, recent] = await Promise.all([
    productRepo.countBy({ active: true }),
    batchRepo
      .createQueryBuilder("batch")
      .select("COALESCE(SUM(batch.quantity), 0)", "total")
      .where("batch.branch_id = :branchId", { branchId })
      .getRawOne<{ total: string }>(),
    batchRepo
      .createQueryBuilder("batch")
      .where("batch.branch_id = :branchId", { branchId })
      .andWhere("batch.quantity > 0")
      .andWhere("batch.expiration_date BETWEEN :date AND :soon", {
        date,
        soon: soonDate,
      })
      .getCount(),
    batchRepo
      .createQueryBuilder("batch")
      .where("batch.branch_id = :branchId", { branchId })
      .andWhere("batch.quantity > 0")
      .andWhere("batch.expiration_date < :date", { date })
      .getCount(),
    movementRepo.find({
      where: { branchId },
      relations: { product: true, user: true },
      order: { createdAt: "DESC" },
      take: 8,
    }),
  ]);

  const expiringItems = await batchRepo
    .createQueryBuilder("batch")
    .leftJoinAndSelect("batch.product", "product")
    .where("batch.branch_id = :branchId", { branchId })
    .andWhere("batch.quantity > 0")
    .andWhere("batch.expiration_date >= :date", { date })
    .orderBy("batch.expiration_date", "ASC")
    .take(6)
    .getMany();

  return {
    products,
    totalUnits: Number(stockRaw?.total ?? 0),
    expiring,
    expired,
    recent,
    expiringItems,
  };
}
