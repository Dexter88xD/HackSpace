import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHackathonUsers1792496008033 implements MigrationInterface {
  name = 'CreateHackathonUsers1792496008033';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."hackathon_role_name_enum" AS ENUM('ORGANIZER', 'PARTICIPANT', 'JURY', 'MENTOR')`,
    );

    await queryRunner.query(`
      CREATE TABLE "hackathon_users" (
        "id" SERIAL NOT NULL,
        "hack_role_name" "public"."hackathon_role_name_enum" NOT NULL,
        "user_id" integer NOT NULL,
        "hackathon_id" integer NOT NULL,

        CONSTRAINT "PK_hackathon_users"
          PRIMARY KEY ("id"),

        CONSTRAINT "UQ_hackathon_users_user_hackathon"
          UNIQUE ("user_id", "hackathon_id"),

        CONSTRAINT "FK_hackathon_users_user"
          FOREIGN KEY ("user_id")
          REFERENCES "users"("id")
          ON DELETE CASCADE,

        CONSTRAINT "FK_hackathon_users_hackathon"
          FOREIGN KEY ("hackathon_id")
          REFERENCES "hackathons"("id")
          ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "hackathon_users"`);
    await queryRunner.query(`DROP TYPE "public"."hackathon_role_name_enum"`);
  }
}
