import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHackathonPhases1791461522691 implements MigrationInterface {
  name = 'CreateHackathonPhases1791461522691';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."hackathon_phases_phase_name_enum" AS ENUM('LAUNCH', 'REGISTRATION', 'IN_PROGRESS', 'EVALUATION', 'FINISHED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hackathon_phases" ("id" SERIAL NOT NULL, "phase_name" "public"."hackathon_phases_phase_name_enum" NOT NULL, "description" text, "start_at" TIMESTAMP NOT NULL, "end_at" TIMESTAMP NOT NULL, "hackathon_id" integer NOT NULL, CONSTRAINT "CHK_e3a4b323f677dcafb505a9e283" CHECK ("start_at" < "end_at"), CONSTRAINT "PK_f73548b051d65fd3c4aef343ac7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_phases" ADD CONSTRAINT "FK_6a7491273631231219005df5040" FOREIGN KEY ("hackathon_id") REFERENCES "hackathons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hackathon_phases" DROP CONSTRAINT "FK_6a7491273631231219005df5040"`,
    );
    await queryRunner.query(`DROP TABLE "hackathon_phases"`);
    await queryRunner.query(
      `DROP TYPE "public"."hackathon_phases_phase_name_enum"`,
    );
  }
}
