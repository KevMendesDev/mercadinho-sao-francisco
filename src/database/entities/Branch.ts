import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { StockBatch } from "./StockBatch";
import { StockMovement } from "./StockMovement";
import { UserBranch } from "./UserBranch";

@Entity("branches")
export class Branch {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ length: 120 }) name!: string;
  @Column({ length: 120, unique: true }) slug!: string;
  @Column({ default: true }) active!: boolean;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" }) updatedAt!: Date;

  @OneToMany(() => UserBranch, (userBranch) => userBranch.branch) userAccesses!: UserBranch[];
  @OneToMany(() => StockBatch, (batch) => batch.branch) batches!: StockBatch[];
  @OneToMany(() => StockMovement, (movement) => movement.branch) movements!: StockMovement[];
}
