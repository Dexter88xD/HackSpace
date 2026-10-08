import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorHackathonSettings1791478748117 implements MigrationInterface {
  name = 'RefactorHackathonSettings1791478748117';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "hackathon_settings"
      DROP CONSTRAINT "CHK_6a4c05f1495d5ba1b9f52e5f7a"
    `);

    await queryRunner.query(`
      ALTER TABLE "hackathon_settings"
      RENAME COLUMN "additional_files_limit" TO "files_limit"
    `);

    await queryRunner.query(`
      ALTER TABLE "hackathon_settings"
      DROP COLUMN "additional_file"
    `);

    await queryRunner.query(`
      ALTER TABLE "hackathon_settings"
      ADD CONSTRAINT "CHK_a07179815011e10b70cce35a7f"
      CHECK ("files_limit" >= 0 AND "file_max_size" >= 0)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "hackathon_settings"
      DROP CONSTRAINT "CHK_a07179815011e10b70cce35a7f"
    `);

    await queryRunner.query(`
      ALTER TABLE "hackathon_settings"
      RENAME COLUMN "files_limit" TO "additional_files_limit"
    `);

    await queryRunner.query(`
      ALTER TABLE "hackathon_settings"
      ADD "additional_file" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "hackathon_settings"
      ADD CONSTRAINT "CHK_6a4c05f1495d5ba1b9f52e5f7a"
      CHECK ("additional_files_limit" >= 0 AND "file_max_size" >= 0)
    `);
  }
}
