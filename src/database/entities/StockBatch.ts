import { Check, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { Relation } from "typeorm";
import { Branch } from "./Branch";
import { Product } from "./Product";
import { User } from "./User";

@Entity("stock_batches")
@Check("chk_stock_batch_quantity_non_negative", '"quantity" >= 0')
export class StockBatch {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "product_id", type: "uuid" }) productId!: string;
  @Column({ name: "branch_id", type: "uuid" }) branchId!: string;
  @Column({ type: "integer" }) quantity!: number;
  @Column({ name: "expiration_date", type: "date" }) expirationDate!: string;
  @Column({ name: "unit_cost", type: "numeric", precision: 12, scale: 2, nullable: true }) unitCost!: string | null;
  @Column({ name: "created_by_user_id", type: "uuid", nullable: true }) createdByUserId!: string | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" }) updatedAt!: Date;

  @ManyToOne(() => Product, (product) => product.batches, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "product_id" }) product!: Relation<Product>;
  @ManyToOne(() => Branch, (branch) => branch.batches, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "branch_id" }) branch!: Relation<Branch>;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "created_by_user_id" }) createdByUser!: Relation<User> | null;
}
