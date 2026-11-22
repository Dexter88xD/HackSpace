import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateJuryScoring1795310793374 implements MigrationInterface {
  name = 'CreateJuryScoring1795310793374';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "scoring_criteria" ("id" SERIAL NOT NULL, "title" character varying(100) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "hackathon_id" integer NOT NULL, CONSTRAINT "UQ_scoring_criteria_hackathon_title" UNIQUE ("hackathon_id", "title"), CONSTRAINT "PK_8df76962c0b1622a2cd986b734d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "scores" ("id" SERIAL NOT NULL, "score" integer NOT NULL, "comment" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "judge_id" integer NOT NULL, "team_id" integer NOT NULL, "criterion_id" integer NOT NULL, CONSTRAINT "UQ_scores_judge_team_criterion" UNIQUE ("judge_id", "team_id", "criterion_id"), CONSTRAINT "CHK_scores_range" CHECK ("score" >= 0 AND "score" <= 10), CONSTRAINT "PK_c36917e6f26293b91d04b8fd521" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "scoring_criteria" ADD CONSTRAINT "FK_fe613864a6a10d708e18bfab299" FOREIGN KEY ("hackathon_id") REFERENCES "hackathons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scores" ADD CONSTRAINT "FK_0cebfe9386a6ecf1063aacf4cf6" FOREIGN KEY ("judge_id") REFERENCES "hackathon_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scores" ADD CONSTRAINT "FK_e424323a9def06837edb98cc125" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scores" ADD CONSTRAINT "FK_8d505be5213d9949278e76b4cae" FOREIGN KEY ("criterion_id") REFERENCES "scoring_criteria"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "scores" DROP CONSTRAINT "FK_8d505be5213d9949278e76b4cae"`,
    );
    await queryRunner.query(
      `ALTER TABLE "scores" DROP CONSTRAINT "FK_e424323a9def06837edb98cc125"`,
    );
    await queryRunner.query(
      `ALTER TABLE "scores" DROP CONSTRAINT "FK_0cebfe9386a6ecf1063aacf4cf6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "scoring_criteria" DROP CONSTRAINT "FK_fe613864a6a10d708e18bfab299"`,
    );
    await queryRunner.query(`DROP TABLE "scores"`);
    await queryRunner.query(`DROP TABLE "scoring_criteria"`);
  }
}
