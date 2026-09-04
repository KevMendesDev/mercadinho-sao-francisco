import { MigrationInterface, QueryRunner } from "typeorm";

export class UserSessions1788000000000 implements MigrationInterface {
  name = "UserSessions1788000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "token_hash" varchar(64) NOT NULL,
        "csrf_token_hash" varchar(64) NOT NULL,
        "user_id" uuid NOT NULL,
        "branch_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "last_activity_at" timestamptz NOT NULL,
        "idle_expires_at" timestamptz NOT NULL,
        "absolute_expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz,
        CONSTRAINT "PK_user_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_sessions_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_user_sessions_token_hash" ON "user_sessions" ("token_hash")`);
    await queryRunner.query(`CREATE INDEX "idx_user_sessions_user" ON "user_sessions" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_user_sessions_expiry" ON "user_sessions" ("idle_expires_at", "absolute_expires_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_sessions"`);
  }
}
