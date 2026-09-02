import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { loginSchema } from "@/lib/validation/schemas";
import { authenticate } from "@/lib/services/auth.service";
import { BadRequestError, PayloadTooLargeError } from "@/lib/errors";

const MAX_LOGIN_BODY_BYTES = 4 * 1024;

async function readLoginBody(request: Request): Promise<unknown> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_LOGIN_BODY_BYTES) throw new PayloadTooLargeError();
  if (!request.body) throw new BadRequestError("Corpo da requisição ausente.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_LOGIN_BODY_BYTES) {
      await reader.cancel();
      throw new PayloadTooLargeError();
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));
  } catch {
    throw new BadRequestError("JSON de login inválido.");
  }
}

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await readLoginBody(request));
    await authenticate(input.email, input.password, input.branchId);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
