import { MigrationInterface, QueryRunner } from 'typeorm';

export class UniqueHackathonPhaseName1794000000001 implements MigrationInterface {
  name = 'UniqueHackathonPhaseName1794000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hackathon_phases" ADD CONSTRAINT "UQ_hackathon_phase_name" UNIQUE ("hackathon_id", "phase_name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hackathon_phases" DROP CONSTRAINT "UQ_hackathon_phase_name"`,
    );
  }
}
