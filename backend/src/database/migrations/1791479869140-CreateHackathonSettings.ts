import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHackathonSettings1791479869140 implements MigrationInterface {
  name = 'CreateHackathonSettings1791479869140';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "hackathon_settings" ("id" SERIAL NOT NULL, "min_team_members" integer NOT NULL, "max_team_members" integer NOT NULL, "files_limit" integer NOT NULL DEFAULT '0', "file_max_size" integer NOT NULL DEFAULT '0', "hackathon_id" integer NOT NULL, CONSTRAINT "REL_a596fb902a7faf3623fd2f4e17" UNIQUE ("hackathon_id"), CONSTRAINT "CHK_e68a8a59395a9940b5b17b1446" CHECK ("files_limit" >= 0 AND "file_max_size" >= 0), CONSTRAINT "CHK_911bb42a906b534ac29a5b6c71" CHECK ("min_team_members" >= 1 AND "max_team_members" >= "min_team_members"), CONSTRAINT "PK_e012c304f013734e08d90b96235" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_settings" ADD CONSTRAINT "FK_55bd6eb7342132f863f6863ab3a" FOREIGN KEY ("hackathon_id") REFERENCES "hackathons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hackathon_settings" DROP CONSTRAINT "FK_55bd6eb7342132f863f6863ab3a"`,
    );
    await queryRunner.query(`DROP TABLE "hackathon_settings"`);
  }
}
