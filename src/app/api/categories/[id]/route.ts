import { NextResponse } from "next/server";
import { UserRole } from "@/database/entities";
import { apiError } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/authorization";
import { deleteCategory, updateCategory } from "@/lib/services/category.service";
import { categorySchema } from "@/lib/validation/schemas";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireApiUser([UserRole.ADMIN, UserRole.MANAGER]);
    const { id } = await context.params;
    const input = categorySchema.parse(await request.json());
    return NextResponse.json(await updateCategory(id, input.name, user.id));
  } catch (error) { return apiError(error); }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireApiUser([UserRole.ADMIN, UserRole.MANAGER]);
    const { id } = await context.params;
    await deleteCategory(id, user.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
