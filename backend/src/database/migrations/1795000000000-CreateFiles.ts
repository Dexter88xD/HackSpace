import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFiles1795000000000 implements MigrationInterface {
  name = 'CreateFiles1795000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "files_file_type_enum" AS ENUM ('PDF', 'DOCX', 'PPTX', 'TXT', 'CSV', 'JPG', 'PNG')
    `);
    await queryRunner.query(`
      CREATE TABLE "files" (
        "id" uuid NOT NULL,
        "name" text NOT NULL,
        "bucket" character varying(63) NOT NULL,
        "url" text NOT NULL,
        "file_type" "files_file_type_enum" NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "hackathon_id" integer,
        "team_id" integer,
        CONSTRAINT "PK_files" PRIMARY KEY ("id"),
        CONSTRAINT "FK_files_hackathon" FOREIGN KEY ("hackathon_id") REFERENCES "hackathons"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_files_team" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "files"');
    await queryRunner.query('DROP TYPE "files_file_type_enum"');
  }
}
