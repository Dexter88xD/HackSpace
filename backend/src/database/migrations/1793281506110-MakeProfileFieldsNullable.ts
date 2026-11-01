import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeProfileFieldsNullable1793281506110
  implements MigrationInterface
{
  name = 'MakeProfileFieldsNullable1793281506110';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ALTER COLUMN "bio" TYPE text
    `);

    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ALTER COLUMN "avatar_url" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ALTER COLUMN "organization_name" TYPE varchar(100),
      ALTER COLUMN "organization_name" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ALTER COLUMN "major" TYPE varchar(100),
      ALTER COLUMN "major" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ALTER COLUMN "bio" TYPE varchar
    `);

    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ALTER COLUMN "avatar_url" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ALTER COLUMN "organization_name" SET NOT NULL,
      ALTER COLUMN "organization_name" TYPE varchar
    `);

    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ALTER COLUMN "major" SET NOT NULL,
      ALTER COLUMN "major" TYPE varchar
    `);
  }
}