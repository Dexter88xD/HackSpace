import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceGithubWithGoogle1792100000000 implements MigrationInterface {
  name = 'ReplaceGithubWithGoogle1792100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."oauth_identities_provider_enum" RENAME VALUE 'github' TO 'google'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."oauth_identities_provider_enum" RENAME VALUE 'google' TO 'github'`,
    );
  }
}
