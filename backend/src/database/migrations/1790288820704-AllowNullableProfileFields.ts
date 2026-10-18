import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowNullableProfileFields1790288820704 implements MigrationInterface {
  name = 'AllowNullableProfileFields1790288820704';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "user_profiles" ALTER COLUMN "avatar_url" DROP NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "user_profiles" ALTER COLUMN "organization_name" DROP NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "user_profiles" ALTER COLUMN "major" DROP NOT NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "user_profiles" ALTER COLUMN "major" SET NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "user_profiles" ALTER COLUMN "organization_name" SET NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "user_profiles" ALTER COLUMN "avatar_url" SET NOT NULL',
    );
  }
}
