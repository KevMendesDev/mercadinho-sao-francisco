import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/authorization";
import { lookupBarcode } from "@/lib/services/product.service";
import { BadRequestError } from "@/lib/errors";

export async function GET(_: Request, context: { params: Promise<{ barcode: string }> }) {
  try {
    await requireApiUser();
    const { barcode } = await context.params;
    if (!/^\d{8,14}$/.test(barcode)) throw new BadRequestError("Informe um código de barras entre 8 e 14 dígitos.");
    return NextResponse.json(await lookupBarcode(barcode));
  } catch (error) { return apiError(error); }
}
