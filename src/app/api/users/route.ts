import { NextResponse } from "next/server";
import { UserRole } from "@/database/entities";
import { apiError } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/authorization";
import { assertSessionCsrf } from "@/lib/auth/csrf";
import { createUser, listUsers } from "@/lib/services/user.service";
import { userCreateSchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  try {
    await requireApiUser([UserRole.ADMIN]);
    const url = new URL(request.url);
    const users = await listUsers(Number(url.searchParams.get("page")), Number(url.searchParams.get("size")));
    return NextResponse.json({ ...users, content: users.content.map((user) => ({
      id: user.id, name: user.name, email: user.email, role: user.role, active: user.active && !user.deletedAt,
      lastAccessAt: user.lastAccessAt, branchIds: user.branchAccesses.map((access) => access.branchId),
      branches: user.branchAccesses.map((access) => access.branch.name),
    })) });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const { user, session } = await requireApiUser([UserRole.ADMIN]);
    await assertSessionCsrf(request, session);
    const input = userCreateSchema.parse(await request.json());
    const created = await createUser(input, user.id);
    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (error) { return apiError(error); }
}
