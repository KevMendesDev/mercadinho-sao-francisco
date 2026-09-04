import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { assertBranchAccess, requireApiUser } from "@/lib/auth/authorization";
import { updateSessionBranch } from "@/lib/auth/session";
import { assertSessionCsrf } from "@/lib/auth/csrf";
import { getDataSource } from "@/database/data-source";
import { Branch } from "@/database/entities";
import { BadRequestError } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const { session, user } = await requireApiUser();
    await assertSessionCsrf(request, session);
    const { branchId } = z.object({ branchId: z.uuid() }).parse(await request.json());
    const db = await getDataSource();
    if (!(await db.getRepository<Branch>("branches").existsBy({ id: branchId, active: true }))) throw new BadRequestError("Filial selecionada não está disponível.");
    await assertBranchAccess(user, branchId);
    await updateSessionBranch(session.sessionId, branchId);
    return NextResponse.json({ ok: true, previousBranchId: session.branchId });
  } catch (error) { return apiError(error); }
}
