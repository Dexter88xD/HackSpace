import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParticipantDefaultToHackathonUsers1793726444267 implements MigrationInterface {
  name = 'AddParticipantDefaultToHackathonUsers1793726444267';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "oauth_identities" DROP CONSTRAINT "FK_oauth_identity_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_phases" DROP CONSTRAINT "FK_6a7491273631231219005df5040"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_settings" DROP CONSTRAINT "FK_a596fb902a7faf3623fd2f4e179"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_users" DROP CONSTRAINT "FK_hackathon_users_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_users" DROP CONSTRAINT "FK_hackathon_users_hackathon"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathons" DROP CONSTRAINT "CHK_hackathons_valid_dates"`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth_identities" DROP CONSTRAINT "UQ_oauth_provider_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth_identities" ALTER COLUMN "userId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_users" ALTER COLUMN "hack_role_name" SET DEFAULT 'PARTICIPANT'`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathons" ADD CONSTRAINT "CHK_be9af61361729a2afff7e2089c" CHECK ("start_at" < "end_at")`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth_identities" ADD CONSTRAINT "UQ_028aac27b9c74d600a727dd84d5" UNIQUE ("provider", "provider_user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth_identities" ADD CONSTRAINT "FK_b731ba99f5f90815d56cd295c45" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_phases" ADD CONSTRAINT "FK_9e6c46bb6681631ac3d82dee8da" FOREIGN KEY ("hackathon_id") REFERENCES "hackathons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_settings" ADD CONSTRAINT "FK_55bd6eb7342132f863f6863ab3a" FOREIGN KEY ("hackathon_id") REFERENCES "hackathons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_users" ADD CONSTRAINT "FK_11097450ded15ef141d3d549265" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_users" ADD CONSTRAINT "FK_4708bd8e9b236ed2c9ba65dcbd8" FOREIGN KEY ("hackathon_id") REFERENCES "hackathons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hackathon_users" DROP CONSTRAINT "FK_4708bd8e9b236ed2c9ba65dcbd8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_users" DROP CONSTRAINT "FK_11097450ded15ef141d3d549265"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_settings" DROP CONSTRAINT "FK_55bd6eb7342132f863f6863ab3a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathon_phases" DROP CONSTRAINT "FK_9e6c46bb6681631ac3d82dee8da"`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth_identities" DROP CONSTRAINT "FK_b731ba99f5f90815d56cd295c45"`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth_identities" DROP CONSTRAINT "UQ_028aac27b9c74d600a727dd84d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hackathons" DROP CONSTRAINT "CHK_be9af61361729a2afff7e2089c"`,
    );
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
