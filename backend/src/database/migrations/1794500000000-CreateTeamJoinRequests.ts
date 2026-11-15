import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTeamJoinRequests1794500000000 implements MigrationInterface {
  name = 'CreateTeamJoinRequests1794500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "team_join_requests" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "team_id" integer NOT NULL,
        "hackathon_user_id" integer NOT NULL,

        CONSTRAINT "PK_team_join_requests"
          PRIMARY KEY ("id"),

        CONSTRAINT "UQ_team_join_requests_team_user"
          UNIQUE ("team_id", "hackathon_user_id"),

        CONSTRAINT "FK_55848c4b1b1c0cd3289de824cd6"
          FOREIGN KEY ("team_id")
          REFERENCES "teams"("id")
          ON DELETE CASCADE,

        CONSTRAINT "FK_52d7c89a9086f9378b7e0e7ae87"
          FOREIGN KEY ("hackathon_user_id")
          REFERENCES "hackathon_users"("id")
          ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "team_join_requests"`);
  }
}
