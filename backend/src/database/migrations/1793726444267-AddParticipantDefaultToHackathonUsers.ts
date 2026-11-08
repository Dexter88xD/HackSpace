import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParticipantDefaultToHackathonUsers1793726444267 implements MigrationInterface {
  name = 'AddParticipantDefaultToHackathonUsers1793726444267';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hackathon_users" ALTER COLUMN "hack_role_name" SET DEFAULT 'PARTICIPANT'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hackathon_users" ALTER COLUMN "hack_role_name" DROP DEFAULT`,
    );
  }
}
