import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFriendships1795298225119 implements MigrationInterface {
    name = 'CreateFriendships1795298225119'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_user_profiles_avatar_file"`);
        await queryRunner.query(`ALTER TABLE "hackathon_settings" DROP CONSTRAINT "CHK_8e1ab55b0e50bf093e7cb364e8"`);
        await queryRunner.query(`ALTER TABLE "hackathon_phases" DROP CONSTRAINT "UQ_hackathon_phase_name"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" RENAME COLUMN "avatar_file_id" TO "avatar_url"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" RENAME CONSTRAINT "UQ_9931a8ba2d4691fd34ecc051475" TO "UQ_369c2f48f199fe53551abbf86a5"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP CONSTRAINT "UQ_369c2f48f199fe53551abbf86a5"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "avatar_url"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "avatar_url" character varying`);
        await queryRunner.query(`ALTER TABLE "hackathon_settings" ALTER COLUMN "files_limit" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "hackathon_settings" ALTER COLUMN "file_max_size" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "hackathon_settings" ADD CONSTRAINT "CHK_e68a8a59395a9940b5b17b1446" CHECK ("files_limit" >= 0 AND "file_max_size" >= 0)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hackathon_settings" DROP CONSTRAINT "CHK_e68a8a59395a9940b5b17b1446"`);
        await queryRunner.query(`ALTER TABLE "hackathon_settings" ALTER COLUMN "file_max_size" SET DEFAULT '10485760'`);
        await queryRunner.query(`ALTER TABLE "hackathon_settings" ALTER COLUMN "files_limit" SET DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "avatar_url"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "avatar_url" uuid`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD CONSTRAINT "UQ_369c2f48f199fe53551abbf86a5" UNIQUE ("avatar_url")`);
        await queryRunner.query(`ALTER TABLE "user_profiles" RENAME CONSTRAINT "UQ_369c2f48f199fe53551abbf86a5" TO "UQ_9931a8ba2d4691fd34ecc051475"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" RENAME COLUMN "avatar_url" TO "avatar_file_id"`);
        await queryRunner.query(`ALTER TABLE "hackathon_phases" ADD CONSTRAINT "UQ_hackathon_phase_name" UNIQUE ("phase_name", "hackathon_id")`);
        await queryRunner.query(`ALTER TABLE "hackathon_settings" ADD CONSTRAINT "CHK_8e1ab55b0e50bf093e7cb364e8" CHECK (((files_limit >= 1) AND (file_max_size >= 1)))`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_user_profiles_avatar_file" FOREIGN KEY ("avatar_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
