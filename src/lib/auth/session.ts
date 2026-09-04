import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Branch, User, UserBranch, UserRole, UserSession } from "@/database/entities";
import { getDataSource } from "@/database/data-source";
import { requireAuthSecret } from "@/lib/environment";

export const SESSION_COOKIE_NAME = "msf_session";
export const CSRF_COOKIE_NAME = "msf_csrf";
export const CSRF_HEADER_NAME = "x-msf-csrf";
const IDLE_MS = 30 * 24 * 60 * 60 * 1000;
const ABSOLUTE_MS = 90 * 24 * 60 * 60 * 1000;

export type SessionData = { userId: string; name: string; email: string; role: UserRole; branchId: string; csrfTokenHash: string; sessionId: string };

export function hashSessionToken(token: string): string { return createHash("sha256").update(token).digest("hex"); }
function randomToken(): string { return randomBytes(32).toString("base64url"); }
function cookieOptions(maxAge: number) { return { secure: process.env.NODE_ENV === "production", path: "/", maxAge }; }

async function issueCookies(token: string, csrfToken: string, absoluteExpiresAt: Date): Promise<void> {
  const maxAge = Math.max(0, Math.floor((absoluteExpiresAt.getTime() - Date.now()) / 1000));
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, { ...cookieOptions(maxAge), httpOnly: true, sameSite: "lax" });
  store.set(CSRF_COOKIE_NAME, csrfToken, { ...cookieOptions(maxAge), httpOnly: false, sameSite: "strict" });
}

export async function createSession(data: Omit<SessionData, "csrfTokenHash" | "sessionId">): Promise<void> {
  requireAuthSecret();
  const now = new Date(); const absoluteExpiresAt = new Date(now.getTime() + ABSOLUTE_MS);
  const token = randomToken(); const csrfToken = randomToken(); const db = await getDataSource();
  await db.getRepository<UserSession>("UserSession").save({ tokenHash: hashSessionToken(token), csrfTokenHash: hashSessionToken(csrfToken), userId: data.userId, branchId: data.branchId, lastActivityAt: now, idleExpiresAt: new Date(now.getTime() + IDLE_MS), absoluteExpiresAt, revokedAt: null });
  await issueCookies(token, csrfToken, absoluteExpiresAt);
}

export async function readSession(): Promise<SessionData | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const db = await getDataSource(); const repository = db.getRepository<UserSession>("UserSession");
  const record = await repository.findOne({ where: { tokenHash: hashSessionToken(token) } }); const now = new Date();
  if (!record || record.revokedAt || record.idleExpiresAt <= now || record.absoluteExpiresAt <= now) return null;
  await repository.update(record.id, { lastActivityAt: now, idleExpiresAt: new Date(Math.min(now.getTime() + IDLE_MS, record.absoluteExpiresAt.getTime())) });
  const user = await db.getRepository<User>("User").findOne({ where: { id: record.userId } });
  if (!user) return null;
  return { userId: user.id, name: user.name, email: user.email, role: user.role, branchId: record.branchId, csrfTokenHash: record.csrfTokenHash, sessionId: record.id };
}

export async function revokeSession(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (token) await (await getDataSource()).getRepository<UserSession>("UserSession").update({ tokenHash: hashSessionToken(token) }, { revokedAt: new Date() });
}

export async function updateSessionBranch(sessionId: string, branchId: string): Promise<void> {
  await (await getDataSource()).getRepository<UserSession>("UserSession").update(sessionId, { branchId });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, "", { ...cookieOptions(0), httpOnly: true, sameSite: "lax" });
  store.set(CSRF_COOKIE_NAME, "", { ...cookieOptions(0), httpOnly: false, sameSite: "strict" });
}

export async function requireSession(roles?: UserRole[]): Promise<SessionData> {
  const session = await readSession(); if (!session) redirect("/login");
  const db = await getDataSource(); const user = await db.getRepository<User>("User").findOne({ where: { id: session.userId } });
  const branch = await db.getRepository<Branch>("Branch").findOneBy({ id: session.branchId, active: true });
  const hasAccess = user?.role === UserRole.ADMIN || !!user && await db.getRepository<UserBranch>("UserBranch").existsBy({ userId: user.id, branchId: session.branchId });
  if (!user || !user.active || user.deletedAt || !branch || !hasAccess) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect("/dashboard");
  return { ...session, role: user.role };
}
