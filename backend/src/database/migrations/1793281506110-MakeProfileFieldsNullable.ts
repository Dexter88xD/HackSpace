import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeProfileFieldsNullable1793281506110 implements MigrationInterface {
  name = 'MakeProfileFieldsNullable1793281506110';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ALTER COLUMN "bio" TYPE text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ALTER COLUMN "bio" TYPE varchar
    `);
  }
}
