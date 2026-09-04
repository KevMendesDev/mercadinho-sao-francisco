import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import type { Relation } from "typeorm";
import { Branch } from "./Branch";
import { User } from "./User";

@Entity("user_sessions")
@Index("idx_user_sessions_token_hash", ["tokenHash"], { unique: true })
@Index("idx_user_sessions_user", ["userId"])
export class UserSession {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "token_hash", length: 64 }) tokenHash!: string;
  @Column({ name: "csrf_token_hash", length: 64 }) csrfTokenHash!: string;
  @Column({ name: "user_id", type: "uuid" }) userId!: string;
  @Column({ name: "branch_id", type: "uuid" }) branchId!: string;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
  @Column({ name: "last_activity_at", type: "timestamptz" }) lastActivityAt!: Date;
  @Column({ name: "idle_expires_at", type: "timestamptz" }) idleExpiresAt!: Date;
  @Column({ name: "absolute_expires_at", type: "timestamptz" }) absoluteExpiresAt!: Date;
  @Column({ name: "revoked_at", type: "timestamptz", nullable: true }) revokedAt!: Date | null;

  @ManyToOne(() => User, { onDelete: "CASCADE" }) @JoinColumn({ name: "user_id" }) user!: Relation<User>;
  @ManyToOne(() => Branch, { onDelete: "CASCADE" }) @JoinColumn({ name: "branch_id" }) branch!: Relation<Branch>;
}
