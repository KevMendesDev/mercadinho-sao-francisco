import { NextResponse } from "next/server";
import { UserRole } from "@/database/entities";
import { apiError } from "@/lib/api";
import { assertBranchAccess, requireApiUser } from "@/lib/auth/authorization";
import { assertSessionCsrf } from "@/lib/auth/csrf";
import { addStockEntry } from "@/lib/services/stock.service";
import { stockEntrySchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const { user, session } = await requireApiUser([UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR]);
    await assertSessionCsrf(request, session);
    const input = stockEntrySchema.parse(await request.json());
    await assertBranchAccess(user, input.branchId);
    const batch = await addStockEntry({ ...input, userId: user.id });
    return NextResponse.json({ id: batch.id }, { status: 201 });
  } catch (error) { return apiError(error); }
}
