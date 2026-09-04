import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ForbiddenError, UnauthorizedError } from "@/lib/auth/authorization";
import { AppError, TooManyRequestsError } from "@/lib/errors";

export function apiError(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ error: "Dados inválidos.", details: error.issues }, { status: 400 });
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
  if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
  if (error instanceof TooManyRequestsError) return NextResponse.json({ error: error.message }, { status: error.status, headers: { "Retry-After": String(error.retryAfterSeconds) } });
  if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
    return NextResponse.json({ error: "Já existe um registro com estes dados." }, { status: 409 });
  }
  if (typeof error === "object" && error !== null && "code" in error && (error.code === "23001" || error.code === "23503")) {
    return NextResponse.json({ error: "Não é possível excluir este registro porque ele está sendo utilizado." }, { status: 409 });
  }
  console.error("Erro não tratado na API:", error);
  return NextResponse.json({ error: "Não foi possível concluir a operação. Tente novamente." }, { status: 500 });
}
