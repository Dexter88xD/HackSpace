import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFileBucketValues1795000000002 implements MigrationInterface {
  name = 'AddFileBucketValues1795000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."files_bucket_enum" ADD VALUE IF NOT EXISTS 'avatar'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."files_bucket_enum" ADD VALUE IF NOT EXISTS 'submission'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."files_bucket_enum" ADD VALUE IF NOT EXISTS 'hackathon'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL requires recreating an enum to remove values.
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM "files" WHERE "bucket"::text <> 'default') THEN
          RAISE EXCEPTION 'Cannot remove bucket values while files still use them';
        END IF;
      END $$
    `);
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "bucket" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."files_bucket_enum" RENAME TO "files_bucket_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."files_bucket_enum" AS ENUM('default')`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "bucket" TYPE "public"."files_bucket_enum" USING "bucket"::text::"public"."files_bucket_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "bucket" SET DEFAULT 'default'`,
    );
    await queryRunner.query(`DROP TYPE "public"."files_bucket_enum_old"`);
  }
}
