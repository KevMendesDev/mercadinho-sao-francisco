import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { UserBranch } from "./UserBranch";
import { UserRole } from "./enums";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ length: 160 }) name!: string;
  @Column({ length: 190, unique: true }) email!: string;
  @Column({ name: "password_hash", length: 255 }) passwordHash!: string;
  @Column({ type: "enum", enum: UserRole, default: UserRole.OPERATOR }) role!: UserRole;
  @Column({ default: true }) active!: boolean;
  @Column({ name: "last_access_at", type: "timestamptz", nullable: true }) lastAccessAt!: Date | null;
  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true }) deletedAt!: Date | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" }) updatedAt!: Date;

  @OneToMany(() => UserBranch, (userBranch) => userBranch.user, { cascade: true }) branchAccesses!: UserBranch[];
}
