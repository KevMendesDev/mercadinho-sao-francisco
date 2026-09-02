import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { Branch, User, UserBranch, UserRole } from "@/database/entities";
import { getDataSource } from "@/database/data-source";
import { requireAuthSecret } from "@/lib/environment";

const COOKIE_NAME = "msf_session";
const SESSION_SECONDS = 60 * 60 * 10;

export type SessionData = {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  branchId: string;
};

function key(): Uint8Array {
  return new TextEncoder().encode(requireAuthSecret());
}

export async function createSession(data: SessionData): Promise<void> {
  const token = await new SignJWT(data)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(key());
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function readSession(): Promise<SessionData | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload as unknown as SessionData;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function requireSession(roles?: UserRole[]): Promise<SessionData> {
  const session = await readSession();
  if (!session) { redirect("/login"); throw new Error("Sessão inválida."); }

  const db = await getDataSource();
  const user = await db.getRepository<User>("User").findOne({ where: { id: session.userId } });
  const branch = await db.getRepository<Branch>("Branch").findOneBy({ id: session.branchId, active: true });
  if (!user || !user.active || user.deletedAt || !branch) {
    await destroySession();
    redirect("/login");
    throw new Error("Sessão inválida.");
  }
  if (user.role !== UserRole.ADMIN) {
    const access = await db.getRepository<UserBranch>("UserBranch").existsBy({ userId: user.id, branchId: session.branchId });
    if (!access) {
      await destroySession();
      redirect("/login");
      throw new Error("Sessão inválida.");
    }
  }
  if (roles && !roles.includes(user.role)) redirect("/dashboard");
  return { userId: user.id, name: user.name, email: user.email, role: user.role, branchId: session.branchId };
}
