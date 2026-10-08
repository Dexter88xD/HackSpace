import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHackathonSettings1791462831892 implements MigrationInterface {
    name = 'CreateHackathonSettings1791462831892'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "hackathon_settings" ("id" SERIAL NOT NULL, "min_team_members" integer NOT NULL, "max_team_members" integer NOT NULL, "additional_file" boolean NOT NULL DEFAULT false, "additional_files_limit" integer NOT NULL DEFAULT '0', "file_max_size" integer NOT NULL DEFAULT '0', "hackathonId" integer NOT NULL, CONSTRAINT "REL_a596fb902a7faf3623fd2f4e17" UNIQUE ("hackathonId"), CONSTRAINT "CHK_6a4c05f1495d5ba1b9f52e5f7a" CHECK ("additional_files_limit" >= 0 AND "file_max_size" >= 0), CONSTRAINT "CHK_e1f78d541428e8804b380c20b2" CHECK ("min_team_members" >= 1 AND "max_team_members" >= "min_team_members"), CONSTRAINT "PK_e012c304f013734e08d90b96235" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "hackathon_settings" ADD CONSTRAINT "FK_a596fb902a7faf3623fd2f4e179" FOREIGN KEY ("hackathonId") REFERENCES "hackathons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hackathon_settings" DROP CONSTRAINT "FK_a596fb902a7faf3623fd2f4e179"`);
        await queryRunner.query(`DROP TABLE "hackathon_settings"`);
    }

}
