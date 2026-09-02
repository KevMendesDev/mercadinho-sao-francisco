import { NextResponse } from "next/server";
import { UserRole } from "@/database/entities";
import { apiError } from "@/lib/api";
import { assertBranchAccess, requireApiUser } from "@/lib/auth/authorization";
import { adjustBatch } from "@/lib/services/stock.service";
import { stockAdjustmentSchema } from "@/lib/validation/schemas";
import { getDataSource } from "@/database/data-source";
import { StockBatch } from "@/database/entities";
import { NotFoundError } from "@/lib/errors";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireApiUser([UserRole.ADMIN, UserRole.MANAGER]);
    const { id } = await context.params;
    const body = await request.json();
    const input = stockAdjustmentSchema.parse({ ...body, batchId: id });
    const db = await getDataSource();
    const batch = await db.getRepository<StockBatch>("StockBatch").findOneBy({ id });
    if (!batch) throw new NotFoundError("Lote não encontrado.");
    await assertBranchAccess(user, batch.branchId);
    await adjustBatch({ ...input, userId: user.id });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
