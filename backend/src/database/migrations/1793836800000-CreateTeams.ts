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

        CONSTRAINT "FK_teams_hackathon"
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

        CONSTRAINT "FK_team_members_team"
          FOREIGN KEY ("team_id")
          REFERENCES "teams"("id")
          ON DELETE CASCADE,

        CONSTRAINT "FK_team_members_hackathon_user"
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
