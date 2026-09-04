import { NextResponse } from "next/server";
import { UserRole } from "@/database/entities";
import { apiError } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/authorization";
import { assertSessionCsrf } from "@/lib/auth/csrf";
import { updateUser } from "@/lib/services/user.service";
import { userUpdateSchema } from "@/lib/validation/schemas";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, session } = await requireApiUser([UserRole.ADMIN]);
    await assertSessionCsrf(request, session);
    const { id } = await context.params;
    const input = userUpdateSchema.parse(await request.json());
    await updateUser(id, input, user.id);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
