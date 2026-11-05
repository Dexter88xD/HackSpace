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
    await queryRunner.query(
      `ALTER TABLE "oauth_identities" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth_identities" ADD CONSTRAINT "UQ_oauth_provider_user" UNIQUE ("provider", "provider_user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathons" ADD CONSTRAINT "CHK_hackathons_valid_dates" CHECK ((start_at < end_at))`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_users" ADD CONSTRAINT "FK_hackathon_users_hackathon" FOREIGN KEY ("hackathon_id") REFERENCES "hackathons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_users" ADD CONSTRAINT "FK_hackathon_users_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_settings" ADD CONSTRAINT "FK_a596fb902a7faf3623fd2f4e179" FOREIGN KEY ("hackathon_id") REFERENCES "hackathons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_phases" ADD CONSTRAINT "FK_6a7491273631231219005df5040" FOREIGN KEY ("hackathon_id") REFERENCES "hackathons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth_identities" ADD CONSTRAINT "FK_oauth_identity_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
