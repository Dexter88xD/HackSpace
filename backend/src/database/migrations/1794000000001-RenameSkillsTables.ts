import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameSkillsTables1794000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // The old per-profile skills are discarded; the shared catalog is retained.
    await queryRunner.query(`DROP TABLE "user_skills"`);
    await queryRunner.query(`ALTER TABLE "skill" RENAME TO "user_skills"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_skills" RENAME TO "skill"`);
    // Restore the previous schema only; discarded data cannot be recovered.
    await queryRunner.query(`
      CREATE TABLE "user_skills" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "userProfileId" integer,
        CONSTRAINT "PK_4d0a72117fbf387752dbc8506af" PRIMARY KEY ("id"),
        CONSTRAINT "FK_d0d183a9d0ed9b0581a6edd0de7" FOREIGN KEY ("userProfileId")
          REFERENCES "user_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
  }
}
