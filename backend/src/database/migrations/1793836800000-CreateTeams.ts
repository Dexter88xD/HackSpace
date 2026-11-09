import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTeams1793836800000 implements MigrationInterface {
  name = 'CreateTeams1793836800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "teams" (
        "id" SERIAL NOT NULL,
        "name" character varying(50) NOT NULL,
        "description" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "hackathon_id" integer NOT NULL,

        CONSTRAINT "PK_teams"
          PRIMARY KEY ("id"),

        CONSTRAINT "UQ_teams_hackathon_name"
          UNIQUE ("hackathon_id", "name"),

        CONSTRAINT "FK_a12299ca7e9da6211ea6bb4cc34"
          FOREIGN KEY ("hackathon_id")
          REFERENCES "hackathons"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "team_members" (
        "id" SERIAL NOT NULL,
        "joined_at" TIMESTAMP NOT NULL DEFAULT now(),
        "team_id" integer NOT NULL,
        "hackathon_user_id" integer NOT NULL,

        CONSTRAINT "PK_team_members"
          PRIMARY KEY ("id"),

        CONSTRAINT "UQ_team_members_hackathon_user"
          UNIQUE ("hackathon_user_id"),

        CONSTRAINT "FK_fdad7d5768277e60c40e01cdcea"
          FOREIGN KEY ("team_id")
          REFERENCES "teams"("id")
          ON DELETE CASCADE,

        CONSTRAINT "FK_81558f3dfc63ce34cfd1652fe72"
          FOREIGN KEY ("hackathon_user_id")
          REFERENCES "hackathon_users"("id")
          ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "team_members"`);
    await queryRunner.query(`DROP TABLE "teams"`);
  }
}
