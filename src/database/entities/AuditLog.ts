import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("audit_logs")
@Index("idx_audit_entity", ["entityType", "entityId"])
export class AuditLog {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "entity_type", length: 80 }) entityType!: string;
  @Column({ name: "entity_id", length: 80 }) entityId!: string;
  @Column({ length: 80 }) action!: string;
  @Column({ name: "user_id", type: "uuid", nullable: true }) userId!: string | null;
  @Column({ type: "jsonb", nullable: true }) metadata!: Record<string, unknown> | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
}
