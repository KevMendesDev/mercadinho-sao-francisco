import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";
import { assertSessionCsrf } from "@/lib/auth/csrf";
import { requireApiUser } from "@/lib/auth/authorization";
import { revokeSession } from "@/lib/auth/session";
import { apiError } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const { session } = await requireApiUser();
    await assertSessionCsrf(request, session);
    await revokeSession(); await destroySession();
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
