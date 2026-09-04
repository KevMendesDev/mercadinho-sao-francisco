import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ForbiddenError } from "./authorization";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME, hashSessionToken, SessionData } from "./session";

function matches(left: string, right: string): boolean {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) throw new ForbiddenError("Origem da requisição inválida.");
}

export async function assertSessionCsrf(request: Request, session: SessionData): Promise<void> {
  assertSameOrigin(request);
  const header = request.headers.get(CSRF_HEADER_NAME);
  const cookie = (await cookies()).get(CSRF_COOKIE_NAME)?.value;
  if (!header || !cookie || !matches(header, cookie) || !matches(hashSessionToken(header), session.csrfTokenHash)) {
    throw new ForbiddenError("Token CSRF inválido.");
  }
}
