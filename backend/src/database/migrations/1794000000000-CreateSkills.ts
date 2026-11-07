import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSkills1794000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "skill" (
        "id" SERIAL NOT NULL,
        "name" character varying(50) NOT NULL,
        "normalizedName" character varying(50) NOT NULL,
        CONSTRAINT "PK_skill" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_skill_normalized_name" ON "skill" ("normalizedName")`,
    );
    await queryRunner.query(`
      CREATE TABLE "user_profile_skills" (
        "profile_id" integer NOT NULL,
        "skill_id" integer NOT NULL,
        CONSTRAINT "PK_user_profile_skills" PRIMARY KEY ("profile_id", "skill_id"),
        CONSTRAINT "FK_profile_skills_profile" FOREIGN KEY ("profile_id")
          REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_profile_skills_skill" FOREIGN KEY ("skill_id")
          REFERENCES "skill"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_profile_skills_skill" ON "user_profile_skills" ("skill_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_profile_skills"`);
    await queryRunner.query(`DROP TABLE "skill"`);
  }
}
