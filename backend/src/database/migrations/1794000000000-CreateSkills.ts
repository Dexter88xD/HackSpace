import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSkills1794000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_skills" (
        "id" SERIAL NOT NULL,
        "name" character varying(50) NOT NULL,
        "normalized_name" character varying(50) NOT NULL,
        CONSTRAINT "PK_user_skills" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_user_skills_normalized_name" ON "user_skills" ("normalized_name")`,
    );
    await queryRunner.query(`
      CREATE TABLE "user_profile_skills" (
        "profile_id" integer NOT NULL,
        "skill_id" integer NOT NULL,
        CONSTRAINT "PK_user_profile_skills" PRIMARY KEY ("profile_id", "skill_id"),
        CONSTRAINT "FK_88701f028f489b176ec1bdfe57e" FOREIGN KEY ("profile_id")
          REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_da497a205969e1388b3f1598b25" FOREIGN KEY ("skill_id")
          REFERENCES "user_skills"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_88701f028f489b176ec1bdfe57" ON "user_profile_skills" ("profile_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_da497a205969e1388b3f1598b2" ON "user_profile_skills" ("skill_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_profile_skills"`);
    await queryRunner.query(`DROP TABLE "user_skills"`);
  }
}
