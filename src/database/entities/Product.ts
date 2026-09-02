import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { Relation } from "typeorm";
import { Category } from "./Category";
import { StockBatch } from "./StockBatch";
import { StockMovement } from "./StockMovement";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ length: 180 }) name!: string;
  @Column({ type: "varchar", length: 120, nullable: true }) brand!: string | null;
  @Column({ name: "category_id", type: "uuid", nullable: true }) categoryId!: string | null;
  @Column({ type: "varchar", length: 32, nullable: true, unique: true }) barcode!: string | null;
  @Column({ length: 24, default: "UN" }) unit!: string;
  @Column({ type: "numeric", precision: 12, scale: 3, nullable: true }) weight!: string | null;
  @Column({ default: true }) active!: boolean;
  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true }) deletedAt!: Date | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" }) updatedAt!: Date;

  @OneToMany(() => StockBatch, (batch) => batch.product) batches!: StockBatch[];
  @OneToMany(() => StockMovement, (movement) => movement.product) movements!: StockMovement[];
  @ManyToOne(() => Category, (category) => category.products, { nullable: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "category_id" }) category!: Relation<Category> | null;
}
