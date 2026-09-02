import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1787700000000 implements MigrationInterface {
  name = "InitialSchema1787700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`CREATE TYPE "users_role_enum" AS ENUM ('ADMIN','MANAGER','OPERATOR')`);
    await queryRunner.query(`CREATE TYPE "stock_movements_type_enum" AS ENUM ('ENTRY','EXIT','ADJUSTMENT')`);
    await queryRunner.query(`CREATE TYPE "stock_movements_source_enum" AS ENUM ('MANUAL','PDV','INTEGRATION','SYSTEM')`);

    await queryRunner.query(`
      CREATE TABLE "branches" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(120) NOT NULL,
        "slug" varchar(120) NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_branches" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_branches_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(160) NOT NULL,
        "email" varchar(190) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "role" "users_role_enum" NOT NULL DEFAULT 'OPERATOR',
        "active" boolean NOT NULL DEFAULT true,
        "last_access_at" timestamptz,
        "deleted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_branches" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "branch_id" uuid NOT NULL,
        CONSTRAINT "PK_user_branches" PRIMARY KEY ("id"),
        CONSTRAINT "uq_user_branch" UNIQUE ("user_id", "branch_id"),
        CONSTRAINT "FK_user_branches_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_branches_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_user_branches_user" ON "user_branches" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_user_branches_branch" ON "user_branches" ("branch_id")`);

    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(180) NOT NULL,
        "brand" varchar(120),
        "category" varchar(120),
        "barcode" varchar(32),
        "unit" varchar(24) NOT NULL DEFAULT 'UN',
        "package_size" varchar(80),
        "minimum_stock" integer NOT NULL DEFAULT 0,
        "active" boolean NOT NULL DEFAULT true,
        "deleted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_products" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_products_barcode" UNIQUE ("barcode")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_products_name" ON "products" ("name")`);

    await queryRunner.query(`
      CREATE TABLE "stock_batches" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "product_id" uuid NOT NULL,
        "branch_id" uuid NOT NULL,
        "quantity" integer NOT NULL,
        "expiration_date" date NOT NULL,
        "unit_cost" numeric(12,2),
        "created_by_user_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stock_batches" PRIMARY KEY ("id"),
        CONSTRAINT "chk_stock_batch_quantity_non_negative" CHECK ("quantity" >= 0),
        CONSTRAINT "FK_stock_batches_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_stock_batches_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_stock_batches_user" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_stock_batches_branch_expiration" ON "stock_batches" ("branch_id", "expiration_date")`);
    await queryRunner.query(`CREATE INDEX "idx_stock_batches_product_branch" ON "stock_batches" ("product_id", "branch_id")`);

    await queryRunner.query(`
      CREATE TABLE "stock_movements" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "product_id" uuid NOT NULL,
        "branch_id" uuid NOT NULL,
        "batch_id" uuid,
        "type" "stock_movements_type_enum" NOT NULL,
        "quantity" integer NOT NULL,
        "source" "stock_movements_source_enum" NOT NULL DEFAULT 'MANUAL',
        "reason" varchar(300),
        "reference_id" varchar(160),
        "user_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stock_movements" PRIMARY KEY ("id"),
        CONSTRAINT "FK_stock_movements_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_stock_movements_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_stock_movements_batch" FOREIGN KEY ("batch_id") REFERENCES "stock_batches"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_stock_movements_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_stock_movements_branch_created" ON "stock_movements" ("branch_id", "created_at")`);
    await queryRunner.query(`CREATE INDEX "idx_stock_movements_product" ON "stock_movements" ("product_id")`);

    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "entity_type" varchar(80) NOT NULL,
        "entity_id" varchar(80) NOT NULL,
        "action" varchar(80) NOT NULL,
        "user_id" uuid,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_audit_entity" ON "audit_logs" ("entity_type", "entity_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "stock_movements"`);
    await queryRunner.query(`DROP TABLE "stock_batches"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "user_branches"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "branches"`);
    await queryRunner.query(`DROP TYPE "stock_movements_source_enum"`);
    await queryRunner.query(`DROP TYPE "stock_movements_type_enum"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
  }
}
