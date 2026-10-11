import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOAuthIdentities1792000000000 implements MigrationInterface {
  name = 'AddOAuthIdentities1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."oauth_identities_provider_enum" AS ENUM('github', '42')`,
    );
    await queryRunner.query(
      `CREATE TABLE "oauth_identities" ("id" SERIAL NOT NULL, "provider" "public"."oauth_identities_provider_enum" NOT NULL, "provider_user_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer NOT NULL, CONSTRAINT "UQ_oauth_provider_user" UNIQUE ("provider", "provider_user_id"), CONSTRAINT "PK_oauth_identities" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth_identities" ADD CONSTRAINT "FK_oauth_identity_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "oauth_identities" DROP CONSTRAINT "FK_oauth_identity_user"`,
    );
    await queryRunner.query(`DROP TABLE "oauth_identities"`);
    await queryRunner.query(
      `DROP TYPE "public"."oauth_identities_provider_enum"`,
    );
  }
}
