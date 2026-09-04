import { NextResponse } from "next/server";
import { UserRole } from "@/database/entities";
import { apiError } from "@/lib/api";
import { assertBranchAccess, requireApiUser } from "@/lib/auth/authorization";
import { assertSessionCsrf } from "@/lib/auth/csrf";
import { removeStockFefo } from "@/lib/services/stock.service";
import { stockExitSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const { user, session } = await requireApiUser([UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR]);
    await assertSessionCsrf(request, session);
    const input = stockExitSchema.parse(await request.json());
    await assertBranchAccess(user, input.branchId);
    await removeStockFefo({ ...input, userId: user.id });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
