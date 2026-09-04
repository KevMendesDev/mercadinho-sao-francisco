import "server-only";
import { EntityManager } from "typeorm";
import { getDataSource } from "@/database/data-source";
import { LoginRateLimit } from "@/database/entities";
import { TooManyRequestsError } from "@/lib/errors";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;

async function lockRecord(
  manager: EntityManager,
  identifier: string,
): Promise<LoginRateLimit> {
  await manager.query(
    `INSERT INTO "login_rate_limits" ("identifier", "window_started_at", "attempts") VALUES ($1, NOW(), 0) ON CONFLICT ("identifier") DO NOTHING`,
    [identifier],
  );
  const record = await manager
    .getRepository(LoginRateLimit)
    .createQueryBuilder("limit")
    .setLock("pessimistic_write")
    .where("limit.identifier = :identifier", { identifier })
    .getOne();
  if (!record)
    throw new Error("Não foi possível registrar a tentativa de login.");
  return record;
}

export async function consumeLoginAttempt(identifier: string): Promise<void> {
  const db = await getDataSource();
  let blocked = false;
  await db.transaction(async (manager) => {
    const record = await lockRecord(manager, identifier);
    const now = new Date();
    if (record.blockedUntil && record.blockedUntil > now) {
      blocked = true;
      return;
    }
    if (now.getTime() - record.windowStartedAt.getTime() >= WINDOW_MS) {
      record.windowStartedAt = now;
      record.attempts = 0;
      record.blockedUntil = null;
    }
    if (record.attempts >= MAX_ATTEMPTS) {
      record.blockedUntil = new Date(now.getTime() + BLOCK_MS);
      await manager.getRepository(LoginRateLimit).save(record);
      blocked = true;
      return;
    }
    record.attempts += 1;
    await manager.getRepository(LoginRateLimit).save(record);
  });
  if (blocked) throw new TooManyRequestsError();
}

export async function clearLoginAttempts(identifier: string): Promise<void> {
  const db = await getDataSource();
  await db.getRepository(LoginRateLimit).delete({ identifier });
}
