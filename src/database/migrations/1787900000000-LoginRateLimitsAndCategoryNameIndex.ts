import { MigrationInterface, QueryRunner } from "typeorm";

export class LoginRateLimitsAndCategoryNameIndex1787900000000 implements MigrationInterface {
  name = "LoginRateLimitsAndCategoryNameIndex1787900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "login_rate_limits" (
        "identifier" varchar(190) NOT NULL,
        "window_started_at" timestamptz NOT NULL,
        "attempts" integer NOT NULL DEFAULT 0,
        "blocked_until" timestamptz,
        CONSTRAINT "PK_login_rate_limits" PRIMARY KEY ("identifier")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_categories_name_normalized" ON "categories" (LOWER("name"))`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_categories_name_normalized"`);
    await queryRunner.query(`DROP TABLE "login_rate_limits"`);
  }
}
