import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1790288820703 implements MigrationInterface {
  name = 'InitialSchema1790288820703';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_profiles" ("id" SERIAL NOT NULL, "bio" character varying, "avatar_url" character varying NOT NULL, "organization_name" character varying NOT NULL, "major" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "REL_6ca9503d77ae39b4b5a6cc3ba8" UNIQUE ("user_id"), CONSTRAINT "PK_1ec6662219f4605723f1e41b6cb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_roles_role_name_enum" AS ENUM('ROLE_USER', 'ROLE_ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_roles" ("id" SERIAL NOT NULL, "role_name" "public"."user_roles_role_name_enum" NOT NULL, CONSTRAINT "PK_8acd5cf26ebd158416f477de799" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "username" character varying NOT NULL, "full_name" character varying NOT NULL, "email" character varying NOT NULL, "email_verified" boolean NOT NULL DEFAULT false, "password_hash" character varying NOT NULL, "otp_hash" character varying, "otp_expires_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "role_id" integer, CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "user_roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(`DROP TYPE "public"."user_roles_role_name_enum"`);
    await queryRunner.query(`DROP TABLE "user_profiles"`);
  }
}
