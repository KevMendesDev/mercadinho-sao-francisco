import { NextResponse } from "next/server";
import { UserRole } from "@/database/entities";
import { apiError } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/authorization";
import { createCategory, listCategories } from "@/lib/services/category.service";
import { categorySchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    await requireApiUser();
    return NextResponse.json(await listCategories());
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireApiUser([UserRole.ADMIN, UserRole.MANAGER]);
    const input = categorySchema.parse(await request.json());
    return NextResponse.json(await createCategory(input.name, user.id), { status: 201 });
  } catch (error) { return apiError(error); }
}
