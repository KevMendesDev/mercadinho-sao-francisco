import { NextResponse } from "next/server";
import { UserRole } from "@/database/entities";
import { apiError } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/authorization";
import { assertSessionCsrf } from "@/lib/auth/csrf";
import { deleteProduct, updateProduct } from "@/lib/services/product.service";
import { productSchema } from "@/lib/validation/schemas";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, session } = await requireApiUser([UserRole.ADMIN, UserRole.MANAGER]);
    await assertSessionCsrf(request, session);
    const { id } = await context.params;
    const input = productSchema.parse(await request.json());
    return NextResponse.json(await updateProduct(id, { ...input, categoryId: input.categoryId || null, barcode: input.barcode || null }, user.id));
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, session } = await requireApiUser([UserRole.ADMIN, UserRole.MANAGER]);
    await assertSessionCsrf(request, session);
    const { id } = await context.params;
    await deleteProduct(id, user.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
