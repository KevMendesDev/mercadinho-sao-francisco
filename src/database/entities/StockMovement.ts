import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import type { Relation } from "typeorm";
import { Branch } from "./Branch";
import { Product } from "./Product";
import { StockBatch } from "./StockBatch";
import { User } from "./User";
import { MovementSource, StockMovementType } from "./enums";

@Entity("stock_movements")
@Index("idx_stock_movements_branch_created", ["branchId", "createdAt"])
export class StockMovement {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "product_id", type: "uuid" }) productId!: string;
  @Column({ name: "branch_id", type: "uuid" }) branchId!: string;
  @Column({ name: "batch_id", type: "uuid", nullable: true }) batchId!: string | null;
  @Column({ type: "enum", enum: StockMovementType }) type!: StockMovementType;
  @Column({ type: "integer" }) quantity!: number;
  @Column({ type: "enum", enum: MovementSource, default: MovementSource.MANUAL }) source!: MovementSource;
  @Column({ type: "varchar", length: 300, nullable: true }) reason!: string | null;
  @Column({ name: "reference_id", type: "varchar", length: 160, nullable: true }) referenceId!: string | null;
  @Column({ name: "user_id", type: "uuid", nullable: true }) userId!: string | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;

  @ManyToOne(() => Product, (product) => product.movements, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "product_id" }) product!: Relation<Product>;
  @ManyToOne(() => Branch, (branch) => branch.movements, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "branch_id" }) branch!: Relation<Branch>;
  @ManyToOne(() => StockBatch, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "batch_id" }) batch!: Relation<StockBatch> | null;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "user_id" }) user!: Relation<User> | null;
}
