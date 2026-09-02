import { MigrationInterface, QueryRunner } from "typeorm";

export class CategoriesAndProductDetails1787800000000 implements MigrationInterface {
  name = "CategoriesAndProductDetails1787800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(120) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_categories_name" UNIQUE ("name")
      )
    `);
    await queryRunner.query(`
      INSERT INTO "categories" ("name")
      SELECT DISTINCT btrim("category") FROM "products"
      WHERE "category" IS NOT NULL AND btrim("category") <> ''
      ON CONFLICT ("name") DO NOTHING
    `);
    await queryRunner.query(`ALTER TABLE "products" ADD "category_id" uuid`);
    await queryRunner.query(`
      UPDATE "products" AS product SET "category_id" = category."id"
      FROM "categories" AS category
      WHERE btrim(product."category") = category."name"
    `);
    await queryRunner.query(`ALTER TABLE "products" ADD "weight" numeric(12,3)`);
    await queryRunner.query(`UPDATE "products" SET "unit" = 'G' WHERE "unit" NOT IN ('ML', 'G', 'KG', 'L')`);
    await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_products_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT`);
    await queryRunner.query(`CREATE INDEX "idx_products_category" ON "products" ("category_id")`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "category"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "package_size"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "minimum_stock"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD "minimum_stock" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "products" ADD "package_size" varchar(80)`);
    await queryRunner.query(`ALTER TABLE "products" ADD "category" varchar(120)`);
    await queryRunner.query(`UPDATE "products" AS product SET "category" = category."name" FROM "categories" AS category WHERE product."category_id" = category."id"`);
    await queryRunner.query(`DROP INDEX "idx_products_category"`);
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_category"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "weight"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "category_id"`);
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}
