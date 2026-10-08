import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHackathons1791406430285 implements MigrationInterface {
  name = 'CreateHackathons1791406430285';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "hackathons" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" text, "organization_name" character varying NOT NULL, "start_at" TIMESTAMP NOT NULL, "end_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b290177bd925b16bf35bf59961b" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "hackathons"`);
  }
}
