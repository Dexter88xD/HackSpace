import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTeamSubmissions1795055955856 implements MigrationInterface {
  name = 'CreateTeamSubmissions1795055955856';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "teams" ADD CONSTRAINT "UQ_teams_id_hackathon" UNIQUE ("id", "hackathon_id")',
    );
    await queryRunner.query(`
      CREATE TABLE "team_submissions" (
        "team_id" integer PRIMARY KEY,
        "hackathon_id" integer NOT NULL,
        "submitted_at" timestamptz,
        CONSTRAINT "FK_team_submissions_team_hackathon" FOREIGN KEY ("team_id", "hackathon_id")
          REFERENCES "teams" ("id", "hackathon_id") ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "team_submissions"');
    await queryRunner.query(
      'ALTER TABLE "teams" DROP CONSTRAINT "UQ_teams_id_hackathon"',
    );
  }
}
