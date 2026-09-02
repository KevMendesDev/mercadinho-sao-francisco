import { EntityManager } from "typeorm";
import { AuditLog } from "@/database/entities";

export async function writeAudit(
  manager: EntityManager,
  input: { entityType: string; entityId: string; action: string; userId?: string | null; metadata?: Record<string, unknown> | null },
): Promise<void> {
  await manager.getRepository<AuditLog>("AuditLog").save(manager.getRepository<AuditLog>("AuditLog").create({
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    userId: input.userId ?? null,
    metadata: input.metadata ?? null,
  }));
}
