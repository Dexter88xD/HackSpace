import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHackathonPhases1791461522691 implements MigrationInterface {
  name = 'CreateHackathonPhases1791461522691';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."hackathon_phases_phase_name_enum" AS ENUM('LAUNCH', 'REGISTRATION', 'IN_PROGRESS', 'EVALUATION', 'FINISHED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hackathon_phases" ("id" SERIAL NOT NULL, "phase_name" "public"."hackathon_phases_phase_name_enum" NOT NULL, "description" text, "start_at" TIMESTAMP NOT NULL, "end_at" TIMESTAMP NOT NULL, "hackathon_id" integer NOT NULL, CONSTRAINT "CHK_3addbe4902b2f9b2cd42cb07ac" CHECK ("start_at" < "end_at"), CONSTRAINT "PK_f73548b051d65fd3c4aef343ac7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_phases" ADD CONSTRAINT "FK_9e6c46bb6681631ac3d82dee8da" FOREIGN KEY ("hackathon_id") REFERENCES "hackathons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hackathon_phases" DROP CONSTRAINT "FK_9e6c46bb6681631ac3d82dee8da"`,
    );
    await queryRunner.query(`DROP TABLE "hackathon_phases"`);
    await queryRunner.query(
      `DROP TYPE "public"."hackathon_phases_phase_name_enum"`,
    );
  }
}
