import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameSkillsTables1794000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_skills" RENAME TO "user_skills_legacy"`,
    );
    await queryRunner.query(`ALTER TABLE "skill" RENAME TO "user_skills"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_skills" RENAME TO "skill"`);
    await queryRunner.query(
      `ALTER TABLE "user_skills_legacy" RENAME TO "user_skills"`,
    );
  }
}
