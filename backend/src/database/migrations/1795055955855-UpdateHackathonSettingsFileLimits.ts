import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateHackathonSettingsFileLimits1795055955855 implements MigrationInterface {
  name = 'UpdateHackathonSettingsFileLimits1795055955855';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "hackathon_settings"
      DROP CONSTRAINT "CHK_e68a8a59395a9940b5b17b1446"
    `);
    await queryRunner.query(`
      UPDATE "hackathon_settings"
      SET
        "files_limit" = CASE
          WHEN "files_limit" = 0 THEN 1
          ELSE "files_limit"
        END,
        "file_max_size" = CASE WHEN "file_max_size" = 0 THEN 10485760 ELSE "file_max_size" END WHERE "files_limit" = 0 OR "file_max_size" = 0`);
    await queryRunner.query(
      `ALTER TABLE "hackathon_settings" ALTER COLUMN "files_limit" SET DEFAULT 1`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_settings" ALTER COLUMN "file_max_size" SET DEFAULT 10485760`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_settings" ADD CONSTRAINT "CHK_8e1ab55b0e50bf093e7cb364e8" CHECK ("files_limit" >= 1 AND "file_max_size" >= 1)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hackathon_settings" DROP CONSTRAINT "CHK_8e1ab55b0e50bf093e7cb364e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_settings" ALTER COLUMN "files_limit" SET DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_settings" ALTER COLUMN "file_max_size" SET DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_settings" ADD CONSTRAINT "CHK_e68a8a59395a9940b5b17b1446" CHECK ("files_limit" >= 0 AND "file_max_size" >= 0)`,
    );
  }
}
