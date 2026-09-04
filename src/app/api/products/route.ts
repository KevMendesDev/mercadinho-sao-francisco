import { NextResponse } from "next/server";
import { UserRole } from "@/database/entities";
import { apiError } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/authorization";
import { assertSessionCsrf } from "@/lib/auth/csrf";
import { createProduct, listProducts } from "@/lib/services/product.service";
import { productSchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  try {
    await requireApiUser();
    const url = new URL(request.url);
    const search = url.searchParams.get("search") ?? "";
    const page = Number(url.searchParams.get("page"));
    const size = Number(url.searchParams.get("size"));
    return NextResponse.json(await listProducts(search, page, size));
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const { user, session } = await requireApiUser([UserRole.ADMIN, UserRole.MANAGER]);
    await assertSessionCsrf(request, session);
    const input = productSchema.parse(await request.json());
    return NextResponse.json(await createProduct({ ...input, categoryId: input.categoryId || null, barcode: input.barcode || null }, user.id), { status: 201 });
  } catch (error) { return apiError(error); }
}
