import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserDeletedAt1795574655367 implements MigrationInterface {
  name = 'AddUserDeletedAt1795574655367';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "deleted_at" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
  }
}
